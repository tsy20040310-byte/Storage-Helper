import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { IdentityVerificationDto, ReviewVerificationDto } from "./dto/verifications.dto";

@Injectable()
export class VerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: IdentityVerificationDto) {
    const verification = await this.prisma.identityVerification.create({
      data: {
        userId,
        fullName: dto.fullName,
        idNumber: dto.idNumber,
        phone: dto.phone,
        gender: dto.gender as never,
        reviewStatus: "pending"
      }
    });

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        realName: dto.fullName,
        gender: dto.gender as never
      },
      create: {
        userId,
        realName: dto.fullName,
        gender: dto.gender as never
      }
    });

    return verification;
  }

  async myStatus(userId: string) {
    const latest = await this.prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" }
    });

    return latest ?? { reviewStatus: "unverified" };
  }

  async review(id: string, dto: ReviewVerificationDto) {
    return this.prisma.identityVerification.update({
      where: { id },
      data: {
        reviewStatus: dto.reviewStatus as never,
        reviewNote: dto.note,
        reviewedAt: new Date()
      }
    });
  }
}
