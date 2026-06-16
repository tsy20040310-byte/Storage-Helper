import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsService } from "../../common/audit-logs.service";
import { MediaService } from "../../common/media.service";
import { AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateDisputeDto,
  CreateDisputeEvidenceDto,
  CreateDisputeMessageDto,
  ResolveDisputeDto,
  SosDto,
  UpdateSosStatusDto
} from "./dto/disputes.dto";

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mediaService: MediaService
  ) {}

  async triggerSos(user: AuthenticatedUser, orderId: string, dto: SosDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (![order.clientUserId, order.organizerUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to trigger SOS for this order");
    }

    return this.prisma.sosEvent.create({
      data: {
        orderId,
        userId: user.sub,
        organizerId: order.organizerUserId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        status: "new"
      },
      include: {
        order: true,
        user: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });
  }

  async listSosByOrder(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderParticipant(user, orderId);
    return this.prisma.sosEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });
  }

  listAllSos() {
    return this.prisma.sosEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: true,
        user: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });
  }

  async updateSosStatus(user: AuthenticatedUser, id: string, dto: UpdateSosStatusDto) {
    const updated = await this.prisma.sosEvent.update({
      where: { id },
      data: { status: dto.status },
      include: {
        order: true,
        user: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });

    await this.auditLogsService.log(
      { id: user.sub, role: user.role },
      "sos.update_status",
      "sos_event",
      id,
      { status: dto.status }
    );

    return updated;
  }

  async createDispute(user: AuthenticatedUser, orderId: string, dto: CreateDisputeDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    const isClient = order.clientUserId === user.sub;
    const isOrganizer = order.organizerUserId === user.sub;
    if (!isClient && !isOrganizer && user.role !== "admin") {
      throw new ForbiddenException("You are not allowed to create a dispute for this order");
    }

    const respondentUserId =
      user.role === "admin"
        ? order.organizerUserId ?? order.clientUserId
        : isClient
          ? order.organizerUserId
          : order.clientUserId;

    const dispute = await this.prisma.dispute.create({
      data: {
        orderId,
        initiatorUserId: user.sub,
        respondentUserId,
        subject: dto.subject,
        description: dto.description,
        status: "open"
      },
      include: this.disputeInclude()
    });

    if (order.status !== "disputed") {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: "disputed" }
      });
    }

    return this.mapDispute(dispute);
  }

  async listByOrder(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderParticipant(user, orderId);
    const disputes = await this.prisma.dispute.findMany({
      where: { orderId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: this.disputeInclude()
    });
    return disputes.map((dispute) => this.mapDispute(dispute));
  }

  async createMessage(user: AuthenticatedUser, disputeId: string, dto: CreateDisputeMessageDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute || dispute.deletedAt) {
      throw new NotFoundException("Dispute not found");
    }
    await this.assertDisputeParticipant(user, dispute);

    return this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderUserId: user.sub,
        message: dto.message
      },
      include: {
        sender: { include: { profile: true } }
      }
    });
  }

  async createEvidence(user: AuthenticatedUser, disputeId: string, dto: CreateDisputeEvidenceDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute || dispute.deletedAt) {
      throw new NotFoundException("Dispute not found");
    }
    await this.assertDisputeParticipant(user, dispute);

    const evidence = await this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        uploaderUserId: user.sub,
        evidenceType: dto.evidenceType,
        url: dto.url,
        fileSize: null,
        description: dto.description
      },
      include: {
        uploader: { include: { profile: true } }
      }
    });
    return {
      ...evidence,
      ...this.mediaService.normalizeItem(evidence, "file")
    };
  }

  async reviewDispute(user: AuthenticatedUser, id: string) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { id, deletedAt: null }
    });
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }
    if (dispute.status !== "open") {
      throw new BadRequestException("Only open disputes can enter review");
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: { status: "in_review" },
      include: this.disputeInclude()
    });

    await this.auditLogsService.log({ id: user.sub, role: user.role }, "dispute.review", "dispute", id);
    return this.mapDispute(updated);
  }

  async resolveDispute(user: AuthenticatedUser, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findFirst({
      where: { id, deletedAt: null },
      include: {
        order: true
      }
    });
    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }
    if (!["open", "in_review"].includes(dispute.status)) {
      throw new BadRequestException("Only open or in-review disputes can be resolved");
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.resolutionType === "no_fault" ? "rejected" : "resolved",
        resolutionType: dto.resolutionType,
        resolutionNote: dto.resolutionNote,
        resolvedAt: new Date()
      },
      include: this.disputeInclude()
    });

    const deduction = this.safetyScoreDeduction(dto.resolutionType);
    if (deduction > 0 && dispute.respondentUserId) {
      await this.applySafetyPenalty(user, dispute.respondentUserId, deduction, id, dto.resolutionType);
    }

    const openDisputes = await this.prisma.dispute.count({
      where: {
        orderId: dispute.orderId,
        deletedAt: null,
        status: {
          in: ["open", "in_review"]
        }
      }
    });

    if (openDisputes === 0) {
      await this.prisma.order.update({
        where: { id: dispute.orderId },
        data: {
          status: dispute.order.status === "disputed" ? "completed" : dispute.order.status
        }
      });
    }

    await this.auditLogsService.log(
      { id: user.sub, role: user.role },
      "dispute.resolve",
      "dispute",
      id,
      { resolutionType: dto.resolutionType, resolutionNote: dto.resolutionNote ?? null }
    );

    return this.mapDispute(updated);
  }

  async listAllDisputes() {
    const disputes = await this.prisma.dispute.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: this.disputeInclude()
    });
    return disputes.map((dispute) => this.mapDispute(dispute));
  }

  private async applySafetyPenalty(
    actor: AuthenticatedUser,
    userId: string,
    deduction: number,
    disputeId: string,
    resolutionType: ResolveDisputeDto["resolutionType"]
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return;
    }

    const nextScore = Math.max(0, user.safetyScore - deduction);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        safetyScore: nextScore,
        status: nextScore <= 0 ? "banned" : user.status
      }
    });

    await this.auditLogsService.log(
      { id: actor.sub, role: actor.role },
      nextScore <= 0 ? "user.ban" : "user.safety_penalty",
      "user",
      userId,
      { deduction, disputeId, resolutionType, nextScore }
    );
  }

  private safetyScoreDeduction(resolutionType: ResolveDisputeDto["resolutionType"]) {
    switch (resolutionType) {
      case "complaint_upheld":
        return 20;
      case "harassment":
        return 50;
      case "severe_violation":
        return 100;
      default:
        return 0;
    }
  }

  private async assertOrderParticipant(user: AuthenticatedUser, orderId: string) {
    if (user.role === "admin") {
      return;
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (![order.clientUserId, order.organizerUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to access disputes for this order");
    }
  }

  private async assertDisputeParticipant(
    user: AuthenticatedUser,
    dispute: { initiatorUserId: string; respondentUserId: string | null }
  ) {
    if (user.role === "admin") {
      return;
    }
    if (![dispute.initiatorUserId, dispute.respondentUserId].includes(user.sub)) {
      throw new ForbiddenException("You are not allowed to access this dispute");
    }
  }

  private disputeInclude() {
    return {
      order: true,
      initiator: { include: { profile: true } },
      respondent: { include: { profile: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { include: { profile: true } }
        }
      },
      evidences: {
        orderBy: { createdAt: "asc" },
        include: {
          uploader: { include: { profile: true } }
        }
      }
    } as const;
  }

  private mapDispute(dispute: any) {
    return {
      ...dispute,
      evidences:
        dispute.evidences?.map((evidence: any) => ({
          ...evidence,
          ...this.mediaService.normalizeItem(evidence, "file")
        })) ?? []
    };
  }
}
