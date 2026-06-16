import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MediaService } from "../../common/media.service";
import { AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";
import { CreateReviewDto, CreateReviewFollowupDto } from "./dto/reviews.dto";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService
  ) {}

  async create(user: AuthenticatedUser, orderId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.status !== "completed") {
      throw new BadRequestException("Reviews can only be created for completed orders");
    }

    const isClient = order.clientUserId === user.sub;
    const isOrganizer = order.organizerUserId === user.sub;

    if (!isClient && !isOrganizer) {
      throw new ForbiddenException("You are not part of this order");
    }

    const role = isClient ? "client_to_organizer" : "organizer_to_client";
    const revieweeUserId = isClient ? order.organizerUserId : order.clientUserId;

    if (!revieweeUserId) {
      throw new BadRequestException("Review target is missing");
    }

    const review = await this.prisma.orderReview.upsert({
      where: {
        orderId_reviewerUserId_role: {
          orderId,
          reviewerUserId: user.sub,
          role
        }
      },
      update: {
        overallRating: dto.overallRating,
        professionalScore: dto.professionalScore,
        communicationScore: dto.communicationScore,
        punctualityScore: dto.punctualityScore,
        resultScore: dto.resultScore,
        content: dto.content,
        tagsJson: dto.tags?.length ? JSON.stringify(dto.tags) : null,
        deletedAt: null
      },
      create: {
        orderId,
        reviewerUserId: user.sub,
        revieweeUserId,
        role,
        overallRating: dto.overallRating,
        professionalScore: dto.professionalScore,
        communicationScore: dto.communicationScore,
        punctualityScore: dto.punctualityScore,
        resultScore: dto.resultScore,
        content: dto.content,
        tagsJson: dto.tags?.length ? JSON.stringify(dto.tags) : null
      }
    });

    if (dto.media) {
      await this.prisma.reviewMedia.deleteMany({
        where: { reviewId: review.id }
      });

      if (dto.media.length > 0) {
        await this.prisma.reviewMedia.createMany({
          data: dto.media.map((item, index) => ({
            reviewId: review.id,
            mediaType: item.type,
            url: item.url,
            fileSize: null,
            sortOrder: index
          }))
        });
      }
    }

    await this.recalculateReputation(revieweeUserId);
    return this.findReviewById(review.id);
  }

  async createFollowup(user: AuthenticatedUser, reviewId: string, dto: CreateReviewFollowupDto) {
    const review = await this.prisma.orderReview.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (review.reviewerUserId !== user.sub && review.revieweeUserId !== user.sub) {
      throw new ForbiddenException("You are not allowed to follow up on this review");
    }

    return this.prisma.reviewFollowup.create({
      data: {
        reviewId,
        authorUserId: user.sub,
        content: dto.content
      },
      include: {
        author: {
          include: {
            profile: true
          }
        }
      }
    });
  }

  async listByOrder(user: AuthenticatedUser, orderId: string) {
    await this.assertOrderParticipant(user, orderId);
    const reviews = await this.prisma.orderReview.findMany({
      where: { orderId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: this.reviewInclude()
    });
    return reviews.map((review) => this.mapReview(review));
  }

  async listByOrganizer(organizerUserId: string) {
    const reviews = await this.prisma.orderReview.findMany({
      where: {
        revieweeUserId: organizerUserId,
        role: "client_to_organizer",
        deletedAt: null
      },
      orderBy: { createdAt: "desc" },
      include: this.reviewInclude()
    });

    const totalReviews = reviews.length;
    const averageRating = this.average(reviews.map((review) => review.overallRating));
    const professionalScoreAverage = this.average(reviews.map((review) => review.professionalScore ?? review.overallRating));
    const communicationScoreAverage = this.average(reviews.map((review) => review.communicationScore ?? review.overallRating));
    const punctualityScoreAverage = this.average(reviews.map((review) => review.punctualityScore ?? review.overallRating));
    const resultScoreAverage = this.average(reviews.map((review) => review.resultScore ?? review.overallRating));

    return {
      averageRating,
      totalReviews,
      professionalScoreAverage,
      communicationScoreAverage,
      punctualityScoreAverage,
      resultScoreAverage,
      items: reviews.map((review) => this.mapReview(review))
    };
  }

  async listByOrganizerForProfile(organizerUserId: string, take = 20) {
    const reviews = await this.prisma.orderReview.findMany({
      where: {
        revieweeUserId: organizerUserId,
        role: "client_to_organizer",
        deletedAt: null
      },
      orderBy: { createdAt: "desc" },
      take,
      include: this.reviewInclude()
    });
    return reviews.map((review) => this.mapReview(review));
  }

  private async findReviewById(reviewId: string) {
    const review = await this.prisma.orderReview.findFirstOrThrow({
      where: { id: reviewId, deletedAt: null },
      include: this.reviewInclude()
    });
    return this.mapReview(review);
  }

  private reviewInclude() {
    return {
      reviewer: {
        include: {
          profile: true
        }
      },
      reviewee: {
        include: {
          profile: true
        }
      },
      media: {
        orderBy: { sortOrder: "asc" }
      },
      followups: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            include: {
              profile: true
            }
          }
        }
      }
    } as const;
  }

  private average(values: number[]) {
    return values.length === 0 ? 0 : Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }

  private async recalculateReputation(userId: string) {
    const reviews = await this.prisma.orderReview.findMany({
      where: {
        revieweeUserId: userId,
        role: "client_to_organizer",
        deletedAt: null
      }
    });

    const averageRating = this.average(reviews.map((review) => review.overallRating));
    const reputationScore = Math.max(0, Math.round(averageRating * 20 + reviews.length * 80));
    const reputationLevel =
      reputationScore >= 1500
        ? "Lv5 \u4e13\u5bb6\u6574\u7406\u5e08"
        : reputationScore >= 700
          ? "Lv4 \u91d1\u724c\u6574\u7406\u5e08"
          : reputationScore >= 300
            ? "Lv3 \u4f18\u79c0\u6574\u7406\u5e08"
            : reputationScore >= 100
              ? "Lv2 \u8ba4\u8bc1\u6574\u7406\u5e08"
              : "Lv1 \u65b0\u4eba\u6574\u7406\u5e08";

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore,
        reputationLevel
      }
    });
  }

  private mapReview(review: any) {
    return {
      ...review,
      media: this.mediaService.normalizeList(review.media, "image")
    };
  }

  private async assertOrderParticipant(user: AuthenticatedUser, orderId: string) {
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
      throw new ForbiddenException("You are not allowed to access reviews for this order");
    }
  }
}
