import { randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import { ServiceContractsService } from "../service-contracts/service-contracts.service";
import {
  ApplyOrderDto,
  ArrivalCheckDto,
  ClientConfirmApplicationDto,
  CompleteOrderDto,
  CreateOrderDto,
  StartOrderDto
} from "./dto/orders.dto";

@Injectable()
export class OrdersService {
  private static readonly CANDIDATE_POOL_LIMIT = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly serviceContractsService: ServiceContractsService
  ) {}

  async create(clientUserId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        clientUserId,
        title: dto.title,
        description: dto.description,
        cityCode: dto.cityCode,
        addressLine: dto.addressLine,
        floor: dto.floor,
        hasElevator: dto.hasElevator,
        scheduledStartAt: new Date(dto.scheduledStartAt),
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        storageSupplyStatus: dto.storageSupplyStatus as never,
        specialNotes: dto.specialNotes,
        sameGenderOnly: dto.sameGenderOnly,
        genderPreference: dto.genderPreference ?? "no_preference",
        latitude: dto.latitude,
        longitude: dto.longitude,
        startPinCode: "123456",
        media: {
          create: dto.media.map((item, index) => ({
            mediaType: item.type as never,
            url: item.url,
            sortOrder: index
          }))
        },
        session: {
          create: {}
        }
      },
      include: {
        media: true,
        session: true
      }
    });
  }

  async list(user: AuthenticatedUser) {
    await this.releaseExpiredCandidatePools();
    await this.paymentsService.processDueReleases();

    const where =
      user.role === "client"
        ? { clientUserId: user.sub }
        : user.role === "organizer"
          ? { OR: [{ status: "published" }, { status: "applied" }, { status: "candidate_pool_full" }, { organizerUserId: user.sub }] }
          : {};

    return this.prisma.order.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        media: true,
        applications: true,
        session: true,
        serviceContract: true,
        payments: {
          orderBy: { createdAt: "desc" }
        },
        escrowAccount: true,
        sosEvents: {
          orderBy: { createdAt: "desc" }
        },
        disputes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
  }

  async detail(user: AuthenticatedUser, id: string) {
    await this.releaseExpiredCandidatePool(id);
    await this.paymentsService.processDueReleases();
    await this.assertOrderDetailAccess(user, id);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        media: true,
        applications: true,
        session: true,
        client: { include: { profile: true } },
        organizer: { include: { profile: true } },
        serviceContract: true,
        payments: {
          orderBy: { createdAt: "desc" }
        },
        escrowAccount: true,
        refunds: {
          orderBy: { createdAt: "desc" }
        },
        breachRecords: {
          orderBy: { createdAt: "desc" }
        },
        sosEvents: {
          orderBy: { createdAt: "desc" }
        },
        disputes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async apply(organizerUserId: string, orderId: string, dto: ApplyOrderDto) {
    await this.releaseExpiredCandidatePool(orderId);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (!["published", "applied"].includes(order.status)) {
      throw new BadRequestException("Only open orders can be applied");
    }
    if (order.genderPreference === "female_only") {
      const organizer = await this.prisma.user.findUnique({
        where: { id: organizerUserId },
        include: { profile: true }
      });
      if (organizer?.profile?.gender !== "female") {
        throw new ForbiddenException("This order only accepts female organizers");
      }
    }

    const application = await this.prisma.orderApplication.upsert({
      where: {
        orderId_organizerUserId: {
          orderId,
          organizerUserId
        }
      },
      update: {
        message: dto.message,
        quotedPrice: dto.quotedPrice,
        status: "pending"
      },
      create: {
        orderId,
        organizerUserId,
        message: dto.message,
        quotedPrice: dto.quotedPrice
      }
    });

    const totalCandidates = await this.prisma.orderApplication.count({
      where: {
        orderId,
        status: "pending"
      }
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: totalCandidates >= OrdersService.CANDIDATE_POOL_LIMIT ? "candidate_pool_full" : "applied",
        candidatePoolExpiresAt:
          totalCandidates >= OrdersService.CANDIDATE_POOL_LIMIT ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
      }
    });

    return application;
  }

  async confirmApplication(user: AuthenticatedUser, orderId: string, applicationId: string, dto: ClientConfirmApplicationDto) {
    await this.releaseExpiredCandidatePool(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (user.role !== "admin" && order.clientUserId !== user.sub) {
      throw new ForbiddenException("Only the client can confirm an organizer");
    }
    if (!["applied", "candidate_pool_full"].includes(order.status)) {
      throw new BadRequestException("Order is not waiting for organizer confirmation");
    }

    if (!dto.confirmed) {
      return this.prisma.orderApplication.update({
        where: { id: applicationId },
        data: { status: "rejected" }
      });
    }

    const application = await this.prisma.orderApplication.findUnique({ where: { id: applicationId } });
    if (!application || application.orderId !== orderId) {
      throw new NotFoundException("Application not found");
    }
    if (application.status !== "pending") {
      throw new BadRequestException("Only pending applications can be confirmed");
    }

    await this.prisma.orderApplication.update({
      where: { id: applicationId },
      data: { status: "accepted" }
    });

    await this.prisma.orderApplication.updateMany({
      where: {
        orderId,
        id: { not: applicationId },
        status: "pending"
      },
      data: {
        status: "rejected"
      }
    });

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        organizerUserId: application.organizerUserId,
        status: "locked",
        candidatePoolExpiresAt: null
      },
      include: {
        media: true,
        applications: true,
        session: true
      }
    });

    await this.serviceContractsService.createForLockedOrder(orderId, application.organizerUserId, Number(application.quotedPrice ?? 299));

    return updatedOrder;
  }

  async arrivalCheck(user: AuthenticatedUser, orderId: string, dto: ArrivalCheckDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: true }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    this.assertOrganizerAccess(user, order);
    if (order.status !== "locked") {
      throw new BadRequestException("Arrival check is only available for locked orders");
    }

    const distanceMeters = this.distanceMeters(
      Number(order.latitude),
      Number(order.longitude),
      dto.latitude,
      dto.longitude
    );
    const withinRadius = distanceMeters <= order.arrivalRadiusMeters;

    await this.prisma.serviceSession.update({
      where: { orderId },
      data: {
        startVerificationStatus: withinRadius ? "gps_verified" : "failed"
      }
    });

    return {
      orderId,
      distanceMeters,
      withinRadius
    };
  }

  async start(user: AuthenticatedUser, orderId: string, dto: StartOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: true }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    this.assertOrganizerAccess(user, order);
    if (order.status !== "locked") {
      throw new BadRequestException("Only locked orders can start service");
    }
    if (!["gps_verified", "pin_verified", "started"].includes(order.session?.startVerificationStatus ?? "pending")) {
      throw new BadRequestException("Arrival verification has not been completed");
    }
    if (order.startPinCode !== dto.startPinCode) {
      throw new ForbiddenException("Invalid start pin code");
    }

    await this.prisma.serviceSession.update({
      where: { orderId },
      data: {
        startedAt: new Date(),
        startVerificationStatus: "started"
      }
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: "in_service" },
      include: { session: true, media: true }
    });
  }

  async complete(user: AuthenticatedUser, orderId: string, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: true }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    this.assertOrganizerAccess(user, order);
    if (order.status !== "in_service") {
      throw new BadRequestException("Only in-service orders can be completed");
    }

    const session = order.session;
    const endedAt = new Date();
    const actualDurationMinutes = session?.startedAt
      ? Math.max(1, Math.ceil((endedAt.getTime() - session.startedAt.getTime()) / 60000))
      : undefined;

    await this.prisma.serviceSession.update({
      where: { orderId },
      data: {
        endedAt,
        actualDurationMinutes
      }
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: "awaiting_completion_confirmation",
        specialNotes: dto.note
      },
      include: { session: true, media: true }
    });
  }

  async clientConfirmCompletion(user: AuthenticatedUser, orderId: string) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrowAccount: true }
    });
    if (!existingOrder) {
      throw new NotFoundException("Order not found");
    }
    if (user.role !== "admin" && existingOrder.clientUserId !== user.sub) {
      throw new ForbiddenException("Only the client can confirm completion");
    }
    if (existingOrder.status !== "awaiting_completion_confirmation") {
      throw new BadRequestException("Order is not waiting for completion confirmation");
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: "completed",
        completionConfirmedAt: new Date()
      },
      include: { session: true, media: true, escrowAccount: true }
    });

    if (order.escrowAccount?.status === "holding") {
      await this.paymentsService.markCompletionConfirmed(orderId);
    }

    return order;
  }

  async cancel(user: AuthenticatedUser, id: string, dto: { reason: string }) {
    return this.paymentsService.cancelOrder(user, id, dto.reason);
  }

  async createShareLink(user: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (user.role !== "admin" && ![order.clientUserId, order.organizerUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to share this order");
    }
    if (!["in_service", "awaiting_completion_confirmation", "completed"].includes(order.status)) {
      throw new BadRequestException("Share link is available only after service starts");
    }

    const shareToken = order.shareToken ?? randomUUID().replace(/-/g, "");
    await this.prisma.order.update({
      where: { id: orderId },
      data: { shareToken }
    });

    return {
      orderId,
      shareToken,
      shareUrl: `/api/v1/public/orders/share/${shareToken}`
    };
  }

  async getSharedOrder(token: string) {
    const order = await this.prisma.order.findUnique({
      where: { shareToken: token },
      include: {
        organizer: { include: { profile: true } },
        session: true
      }
    });
    if (!order) {
      throw new NotFoundException("Shared order not found");
    }
    if (!["in_service", "awaiting_completion_confirmation", "completed"].includes(order.status)) {
      throw new BadRequestException("This order is not shareable right now");
    }

    const startedAt = order.session?.startedAt ?? null;
    const estimatedEndAt = startedAt
      ? new Date(startedAt.getTime() + order.estimatedDurationMinutes * 60000)
      : null;

    return {
      orderId: order.id,
      status: order.status,
      organizerNickname: order.organizer?.profile?.nickname ?? order.organizer?.phone ?? null,
      startedAt,
      estimatedEndAt
    };
  }

  private async releaseExpiredCandidatePools() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: "candidate_pool_full",
        candidatePoolExpiresAt: {
          lte: new Date()
        }
      },
      select: { id: true }
    });

    for (const order of expiredOrders) {
      await this.releaseExpiredCandidatePool(order.id);
    }
  }

  private async releaseExpiredCandidatePool(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        candidatePoolExpiresAt: true
      }
    });

    if (!order || order.status !== "candidate_pool_full" || !order.candidatePoolExpiresAt || order.candidatePoolExpiresAt > new Date()) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.orderApplication.updateMany({
        where: {
          orderId,
          status: "pending"
        },
        data: {
          status: "withdrawn"
        }
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: "published",
          candidatePoolExpiresAt: null
        }
      })
    ]);
  }

  private distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadiusMeters = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async assertOrderDetailAccess(user: AuthenticatedUser, orderId: string) {
    if (user.role === "admin") {
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        clientUserId: true,
        organizerUserId: true,
        status: true
      }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const organizerCanBrowseOpenOrder =
      user.role === "organizer" && ["published", "applied", "candidate_pool_full"].includes((order as any).status ?? "");

    if (!organizerCanBrowseOpenOrder && ![order.clientUserId, order.organizerUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to access this order");
    }
  }

  private assertOrganizerAccess(
    user: AuthenticatedUser,
    order: { organizerUserId: string | null; clientUserId: string }
  ) {
    if (user.role === "admin") {
      return;
    }

    if (!order.organizerUserId || order.organizerUserId !== user.sub) {
      throw new ForbiddenException("Only the selected organizer can perform this action");
    }
  }
}
