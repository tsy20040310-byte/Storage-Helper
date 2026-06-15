import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
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
  constructor(private readonly prisma: PrismaService) {}

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
    const where =
      user.role === "client"
        ? { clientUserId: user.sub }
        : user.role === "organizer"
          ? { OR: [{ status: "published" }, { organizerUserId: user.sub }] }
          : {};

    return this.prisma.order.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        media: true,
        applications: true,
        session: true
      }
    });
  }

  async detail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        media: true,
        applications: true,
        session: true,
        client: { include: { profile: true } },
        organizer: { include: { profile: true } }
      }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async apply(organizerUserId: string, orderId: string, dto: ApplyOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.status !== "published") {
      throw new BadRequestException("Only published orders can be applied");
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

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: "applied" }
    });

    return application;
  }

  async confirmApplication(orderId: string, applicationId: string, dto: ClientConfirmApplicationDto) {
    if (!dto.confirmed) {
      return this.prisma.orderApplication.update({
        where: { id: applicationId },
        data: { status: "rejected" }
      });
    }

    const application = await this.prisma.orderApplication.findUnique({
      where: { id: applicationId }
    });
    if (!application || application.orderId !== orderId) {
      throw new NotFoundException("Application not found");
    }

    await this.prisma.orderApplication.update({
      where: { id: applicationId },
      data: { status: "accepted" }
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        organizerUserId: application.organizerUserId,
        status: "locked"
      },
      include: {
        media: true,
        applications: true,
        session: true
      }
    });
  }

  async arrivalCheck(orderId: string, dto: ArrivalCheckDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: true }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
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

  async start(orderId: string, dto: StartOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: true }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
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

  async complete(orderId: string, dto: CompleteOrderDto) {
    const session = await this.prisma.serviceSession.findUnique({ where: { orderId } });
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

  async clientConfirmCompletion(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: "completed" },
      include: { session: true, media: true }
    });
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
}
