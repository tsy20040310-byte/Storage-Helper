import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsService } from "../../common/audit-logs.service";
import { AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { CreateBreachRecordDto, CreateRefundDto, MockPayDto, ReviewRefundDto } from "./dto/payments.dto";

@Injectable()
export class PaymentsService {
  private static readonly DEFAULT_DEPOSIT_AMOUNT = 99;
  private static readonly OBSERVATION_HOURS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async mockPay(user: AuthenticatedUser, orderId: string, dto: MockPayDto) {
    await this.processDueReleases();

    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          serviceContract: true,
          payments: { orderBy: { createdAt: "desc" } },
          escrowAccount: true
        }
      });

      if (!order) {
        throw new NotFoundException("Order not found");
      }
      if (user.role !== "admin" && order.clientUserId !== user.sub) {
        throw new ForbiddenException("Only the client can pay for this order");
      }
      if (!order.serviceContract) {
        throw new BadRequestException("Service contract must exist before payment");
      }
      if (!["locked", "in_service", "awaiting_completion_confirmation", "completed"].includes(order.status)) {
        throw new BadRequestException("Order is not payable in the current status");
      }

      const latestPayment = order.payments[0];
      if (latestPayment && ["escrowed", "released"].includes(latestPayment.status)) {
        throw new BadRequestException("Order has already been paid");
      }

      const amount = this.contractTotal(order.serviceContract);
      const provider = process.env.PAYMENT_PROVIDER ?? "mock";
      const providerTransactionId = `mock_${Date.now()}_${orderId.slice(0, 8)}`;

      const pendingPayment =
        latestPayment && latestPayment.status === "pending"
          ? await tx.payment.update({
              where: { id: latestPayment.id },
              data: {
                amount,
                provider,
                providerTransactionId,
                status: "pending"
              }
            })
          : await tx.payment.create({
              data: {
                orderId,
                payerUserId: order.clientUserId,
                amount,
                provider,
                providerTransactionId,
                status: "pending"
              }
            });

      const paidPayment = await tx.payment.update({
        where: { id: pendingPayment.id },
        data: { status: "paid" }
      });

      await this.createTransaction(tx, order.clientUserId, orderId, "payment", -amount, `Mock payment for order ${order.title}`);

      if (dto.autoEscrow !== false) {
        const escrowedPayment = await tx.payment.update({
          where: { id: paidPayment.id },
          data: { status: "escrowed" }
        });

        await tx.escrowAccount.upsert({
          where: { orderId },
          update: {
            amount,
            status: "holding"
          },
          create: {
            orderId,
            amount,
            status: "holding"
          }
        });

        await this.createTransaction(tx, order.clientUserId, orderId, "escrow", 0, `Funds moved to escrow for order ${order.title}`);

        return {
          payment: escrowedPayment,
          escrowStatus: "holding"
        };
      }

      return {
        payment: paidPayment,
        escrowStatus: "unescrowed"
      };
    });
  }

  async getOrderPayments(user: AuthenticatedUser, orderId: string) {
    await this.processDueReleases();
    await this.assertOrderAccess(user, orderId);
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" }
    });
  }

  async getEscrowByOrder(user: AuthenticatedUser, orderId: string) {
    await this.processDueReleases();
    await this.assertOrderAccess(user, orderId);
    return this.prisma.escrowAccount.findUnique({
      where: { orderId }
    });
  }

  async markCompletionConfirmed(orderId: string) {
    return this.prisma.escrowAccount.update({
      where: { orderId },
      data: {
        releaseEligibleAt: new Date(Date.now() + PaymentsService.OBSERVATION_HOURS * 60 * 60 * 1000)
      }
    });
  }

  async releaseEscrow(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderAccess(user, orderId);
    return this.releaseEscrowInternal(orderId);
  }

  private async releaseEscrowInternal(orderId: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          serviceContract: true,
          escrowAccount: true,
          payments: {
            where: {
              status: {
                in: ["paid", "escrowed"]
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!order) {
        throw new NotFoundException("Order not found");
      }
      if (!order.serviceContract || !order.escrowAccount) {
        throw new BadRequestException("Escrow is not ready for release");
      }
      if (order.status !== "completed") {
        throw new BadRequestException("Escrow can only be released after order completion");
      }
      if (order.escrowAccount.status !== "holding") {
        return order.escrowAccount;
      }
      if (!order.escrowAccount.releaseEligibleAt || order.escrowAccount.releaseEligibleAt > new Date()) {
        throw new BadRequestException("Observation period has not ended");
      }

      const payment = order.payments[0];
      if (!payment) {
        throw new BadRequestException("No payment found for this order");
      }

      const totalAmount = Number(order.escrowAccount.amount);
      const platformFee = Number(order.serviceContract.platformFee);

      const escrow = await tx.escrowAccount.update({
        where: { orderId },
        data: {
          status: "released",
          releasedAt: new Date()
        }
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "released" }
      });

      await this.createTransaction(tx, order.organizerUserId, orderId, "release", totalAmount, `Escrow released for order ${order.title}`);
      if (platformFee > 0) {
        await this.createTransaction(tx, order.organizerUserId, orderId, "commission", -platformFee, `Platform fee deducted for order ${order.title}`);
      }

      return escrow;
    });
  }

  async createRefundRequest(user: AuthenticatedUser, orderId: string, dto: CreateRefundDto) {
    return this.createRefundRequestInternal(user.sub, user.role, orderId, dto.reason);
  }

  async listRefundsByOrder(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderAccess(user, orderId);
    return this.prisma.refund.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" }
    });
  }

  async reviewRefund(user: AuthenticatedUser, refundId: string, dto: ReviewRefundDto) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId }
    });

    if (!refund) {
      throw new NotFoundException("Refund not found");
    }
    if (refund.status !== "pending") {
      throw new BadRequestException("Only pending refunds can be reviewed");
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: dto.decision,
        reason: dto.note ? `${refund.reason}\n\nReview note: ${dto.note}` : refund.reason
      }
    });

    await this.auditLogsService.log(
      { id: user.sub, role: user.role },
      "refund.review",
      "refund",
      refundId,
      { decision: dto.decision, note: dto.note ?? null }
    );

    return updatedRefund;
  }

  async completeRefund(user: AuthenticatedUser, refundId: string) {
    const completedRefund = await this.prisma.$transaction(async (tx: any) => {
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
        include: {
          order: {
            include: {
              payments: { orderBy: { createdAt: "desc" } },
              escrowAccount: true
            }
          }
        }
      });

      if (!refund) {
        throw new NotFoundException("Refund not found");
      }
      if (refund.status !== "approved") {
        throw new BadRequestException("Only approved refunds can be completed");
      }

      const payment = refund.order.payments[0];
      if (!payment) {
        throw new BadRequestException("No payment found for the refund order");
      }

      if (refund.order.escrowAccount) {
        await tx.escrowAccount.update({
          where: { orderId: refund.orderId },
          data: {
            status: "refunded",
            releasedAt: new Date()
          }
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "refunded" }
      });

      const refundRecord = await tx.refund.update({
        where: { id: refundId },
        data: { status: "completed" }
      });

      await this.createTransaction(
        tx,
        refund.order.clientUserId,
        refund.orderId,
        "refund",
        Number(refund.refundAmount),
        `Refund completed for order ${refund.order.title}`
      );

      return refundRecord;
    });

    await this.auditLogsService.log({ id: user.sub, role: user.role }, "refund.complete", "refund", refundId);
    return completedRefund;
  }

  async createBreachRecord(user: AuthenticatedUser, orderId: string, dto: CreateBreachRecordDto) {
    const breachRecord = await this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          serviceContract: true
        }
      });

      if (!order) {
        throw new NotFoundException("Order not found");
      }

      const amount = this.breachAmount(order, dto.breachType);
      const userId = dto.breachType.startsWith("organizer") ? order.organizerUserId : order.clientUserId;
      if (!userId) {
        throw new BadRequestException("Breach target user is missing");
      }

      let breachRecord = await tx.breachRecord.create({
        data: {
          orderId,
          userId,
          breachType: dto.breachType,
          amount,
          description: dto.description ?? this.defaultBreachDescription(dto.breachType, amount)
        }
      });

      if (dto.breachType === "organizer_no_show") {
        breachRecord = await this.processOrganizerNoShow(tx, order, breachRecord);
      }

      return breachRecord;
    });

    await this.auditLogsService.log(
      { id: user.sub, role: user.role },
      "breach.create",
      "breach_record",
      breachRecord.id,
      { orderId, breachType: dto.breachType }
    );

    return breachRecord;
  }

  async listBreachRecordsByOrder(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderAccess(user, orderId);
    return this.prisma.breachRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" }
    });
  }

  async processDueReleases() {
    const dueEscrows = await this.prisma.escrowAccount.findMany({
      where: {
        status: "holding",
        releaseEligibleAt: {
          lte: new Date()
        }
      }
    });

    const releasedOrderIds: string[] = [];
    for (const escrow of dueEscrows) {
      try {
        await this.releaseEscrowInternal(escrow.orderId);
        releasedOrderIds.push(escrow.orderId);
      } catch {
        // Skip invalid escrow rows so list/detail APIs remain available.
      }
    }

    return {
      processedCount: releasedOrderIds.length,
      orderIds: releasedOrderIds
    };
  }

  async cancelOrder(user: AuthenticatedUser, orderId: string, reason: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          serviceContract: true,
          payments: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!order) {
        throw new NotFoundException("Order not found");
      }

      const isParticipant = [order.clientUserId, order.organizerUserId].includes(user.sub);
      if (user.role !== "admin" && !isParticipant) {
        throw new ForbiddenException("You are not allowed to cancel this order");
      }
      if (["completed", "cancelled"].includes(order.status)) {
        throw new BadRequestException("Order cannot be cancelled");
      }

      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          candidatePoolExpiresAt: null
        }
      });

      await tx.orderApplication.updateMany({
        where: {
          orderId,
          status: "pending"
        },
        data: {
          status: "withdrawn"
        }
      });

      const payment = order.payments[0];
      const refund = payment && ["paid", "escrowed"].includes(payment.status) ? await this.createRefundRecordWithinTx(tx, order, user, reason) : null;

      return {
        order: cancelledOrder,
        refund
      };
    });
  }

  listPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        payer: { include: { profile: true } }
      }
    });
  }

  listEscrows() {
    return this.prisma.escrowAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true
      }
    });
  }

  listRefunds() {
    return this.prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        requester: { include: { profile: true } }
      }
    });
  }

  listBreachRecords() {
    return this.prisma.breachRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        user: { include: { profile: true } }
      }
    });
  }

  listTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        user: { include: { profile: true } }
      }
    });
  }

  private async createRefundRequestInternal(userId: string, role: AuthenticatedUser["role"], orderId: string, reason: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          serviceContract: true,
          payments: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!order) {
        throw new NotFoundException("Order not found");
      }
      if (role !== "admin" && order.clientUserId !== userId) {
        throw new ForbiddenException("Only the client can request a refund");
      }
      return this.createRefundRecordWithinTx(tx, order, { sub: userId, role, phone: "" }, reason);
    });
  }

  private async createRefundRecordWithinTx(tx: any, order: any, user: AuthenticatedUser, reason: string) {
    const payment = order.payments[0];
    if (!payment || !["paid", "escrowed"].includes(payment.status)) {
      throw new BadRequestException("There is no refundable payment for this order");
    }

    const existingRefund = await tx.refund.findFirst({
      where: {
        orderId: order.id,
        status: { in: ["pending", "approved"] }
      },
      orderBy: { createdAt: "desc" }
    });

    if (existingRefund) {
      return existingRefund;
    }

    const policy = this.calculateRefundPolicy(order, Number(payment.amount));
    if (policy.breachAmount > 0) {
      const breachType = user.sub === order.organizerUserId ? "organizer_cancel_late" : "client_cancel_late";
      await tx.breachRecord.create({
        data: {
          orderId: order.id,
          userId: user.sub,
          breachType,
          amount: policy.breachAmount,
          description: `${reason}. Refund rule: ${policy.ruleLabel}`
        }
      });
    }

    return tx.refund.create({
      data: {
        orderId: order.id,
        requesterId: user.sub,
        reason: `${reason}\n\nRefund rule: ${policy.ruleLabel}`,
        refundAmount: policy.refundAmount,
        status: "pending"
      }
    });
  }

  private calculateRefundPolicy(order: any, paidAmount: number) {
    const createdAt = new Date(order.createdAt);
    const now = order.cancelledAt ? new Date(order.cancelledAt) : new Date();
    const scheduledAt = new Date(order.scheduledStartAt);
    const hoursSinceCreate = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const isSameServiceDay = now.toDateString() === scheduledAt.toDateString();
    const travelFee = Number(order.serviceContract?.travelFee ?? 0);
    const breachFee = Number((paidAmount * 0.1).toFixed(2));

    if (hoursSinceCreate <= 12) {
      return {
        refundAmount: paidAmount,
        breachAmount: 0,
        ruleLabel: "Full refund within 12 hours after order creation"
      };
    }

    if (isSameServiceDay) {
      const refundAmount = Math.max(0, Number((paidAmount - travelFee - breachFee).toFixed(2)));
      return {
        refundAmount,
        breachAmount: breachFee,
        ruleLabel: "Same-day cancellation deducts travel fee and breach fee"
      };
    }

    return {
      refundAmount: Number((paidAmount * 0.9).toFixed(2)),
      breachAmount: breachFee,
      ruleLabel: "Refund 90 percent after 12 hours, 10 percent kept as breach fee"
    };
  }

  private breachAmount(order: any, breachType: CreateBreachRecordDto["breachType"]) {
    const total = order.serviceContract ? this.contractTotal(order.serviceContract) : 99;
    switch (breachType) {
      case "client_no_show":
      case "organizer_no_show":
        return Number(total.toFixed(2));
      case "client_cancel_late":
      case "organizer_cancel_late":
        return Number((total * 0.1).toFixed(2));
      case "organizer_late":
        return Number((total * 0.05).toFixed(2));
      default:
        return 0;
    }
  }

  private defaultBreachDescription(breachType: CreateBreachRecordDto["breachType"], amount: number) {
    return `Breach type ${breachType}, amount ${amount.toFixed(2)}`;
  }

  private async processOrganizerNoShow(tx: any, order: any, breachRecord: any) {
    const deposit = await tx.organizerDeposit.upsert({
      where: { organizerUserId: order.organizerUserId },
      update: {},
      create: {
        organizerUserId: order.organizerUserId,
        amount: PaymentsService.DEFAULT_DEPOSIT_AMOUNT
      }
    });

    const available = Number(deposit.amount);
    const deduction = Math.min(PaymentsService.DEFAULT_DEPOSIT_AMOUNT, available);
    const clientCompensation = Number((deduction * 0.7).toFixed(2));
    const platformPortion = Number((deduction - clientCompensation).toFixed(2));
    const remainingDeposit = Number((available - deduction).toFixed(2));

    await tx.organizerDeposit.update({
      where: { organizerUserId: order.organizerUserId },
      data: {
        amount: remainingDeposit,
        status: remainingDeposit > 0 ? "active" : "depleted"
      }
    });

    await this.createTransaction(
      tx,
      order.organizerUserId,
      order.id,
      "deposit_deduction",
      -clientCompensation,
      `Deposit deduction for client compensation on order ${order.title}`
    );
    if (platformPortion > 0) {
      await this.createTransaction(
        tx,
        order.organizerUserId,
        order.id,
        "commission",
        -platformPortion,
        `Deposit retained by platform for order ${order.title}`
      );
    }
    await this.createTransaction(
      tx,
      order.clientUserId,
      order.id,
      "breach_compensation",
      clientCompensation,
      `Client compensation for organizer no-show on order ${order.title}`
    );

    return tx.breachRecord.update({
      where: { id: breachRecord.id },
      data: {
        amount: deduction,
        status: "processed",
        description: `${breachRecord.description}. Deposit deducted ${deduction.toFixed(2)}, client compensated ${clientCompensation.toFixed(2)}.`
      }
    });
  }

  private contractTotal(contract: { serviceFee: number; travelFee: number; platformFee: number }) {
    return Number((Number(contract.serviceFee) + Number(contract.travelFee) + Number(contract.platformFee)).toFixed(2));
  }

  private async createTransaction(
    tx: any,
    userId: string | null | undefined,
    orderId: string,
    type: string,
    amount: number,
    description: string
  ) {
    if (!userId) {
      return null;
    }

    const latestTransaction = await tx.transaction.findFirst({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });

    const balanceBefore = latestTransaction ? Number(latestTransaction.balanceAfter) : 0;
    const balanceAfter = Number((balanceBefore + amount).toFixed(2));

    return tx.transaction.create({
      data: {
        userId,
        orderId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description
      }
    });
  }

  private async assertOrderAccess(user: AuthenticatedUser, orderId: string) {
    if (user.role === "admin") {
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        clientUserId: true,
        organizerUserId: true
      }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (![order.clientUserId, order.organizerUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to access this order");
    }
  }
}
