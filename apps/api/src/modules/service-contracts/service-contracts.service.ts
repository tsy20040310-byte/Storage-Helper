import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

const CANCELLATION_RULE = "下单后12小时内取消全额退款；超过12小时取消退款90%；服务当天取消需扣除车马费与违约费。";
const BREACH_RULE = "迟到、爽约、临时取消都会生成违约记录；整理师爽约会触发保证金自动赔付。";

@Injectable()
export class ServiceContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForLockedOrder(orderId: string, organizerUserId: string, quotedPrice?: number | null) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { include: { profile: true } },
        organizer: { include: { profile: true } },
        media: true,
        applications: true
      }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const organizer =
      order.organizer?.id === organizerUserId
        ? order.organizer
        : await this.prisma.user.findUnique({
            where: { id: organizerUserId },
            include: { profile: true }
          });

    if (!organizer) {
      throw new NotFoundException("Organizer not found");
    }

    const serviceFee = Number(quotedPrice ?? 299);
    const travelFee = 0;
    const platformFee = Number((serviceFee * 0.1).toFixed(2));

    const contractSnapshot = JSON.stringify({
      order: {
        id: order.id,
        title: order.title,
        description: order.description,
        addressLine: order.addressLine,
        cityCode: order.cityCode,
        scheduledStartAt: order.scheduledStartAt,
        estimatedDurationMinutes: order.estimatedDurationMinutes,
        specialNotes: order.specialNotes,
        sameGenderOnly: order.sameGenderOnly
      },
      client: {
        id: order.client.id,
        phone: order.client.phone,
        nickname: order.client.profile?.nickname,
        realName: order.client.profile?.realName
      },
      organizer: {
        id: organizerUserId,
        phone: organizer.phone,
        nickname: organizer.profile?.nickname,
        realName: organizer.profile?.realName
      },
      pricing: {
        serviceFee,
        travelFee,
        platformFee,
        totalAmount: Number((serviceFee + travelFee + platformFee).toFixed(2))
      },
      rules: {
        cancellationRule: CANCELLATION_RULE,
        breachRule: BREACH_RULE
      },
      generatedAt: new Date().toISOString()
    });

    return this.prisma.serviceContract.upsert({
      where: { orderId },
      update: {
        organizerId: organizerUserId,
        serviceDate: order.scheduledStartAt,
        serviceAddress: order.addressLine,
        serviceFee,
        travelFee,
        platformFee,
        cancellationRule: CANCELLATION_RULE,
        breachRule: BREACH_RULE,
        contractSnapshot,
        signedAt: new Date()
      },
      create: {
        orderId: order.id,
        clientId: order.clientUserId,
        organizerId: organizerUserId,
        serviceDate: order.scheduledStartAt,
        serviceAddress: order.addressLine,
        serviceFee,
        travelFee,
        platformFee,
        cancellationRule: CANCELLATION_RULE,
        breachRule: BREACH_RULE,
        contractSnapshot,
        signedAt: new Date()
      }
    });
  }

  getByOrder(orderId: string) {
    return this.prisma.serviceContract.findUniqueOrThrow({
      where: { orderId }
    });
  }

  listAll() {
    return this.prisma.serviceContract.findMany({
      orderBy: { createdAt: "desc" }
    });
  }
}
