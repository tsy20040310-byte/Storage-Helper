import { Injectable, NotFoundException } from "@nestjs/common";
import { OrganizerProfileTagType, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ReviewsService } from "../reviews/reviews.service";
import { StyleMatchingDto, UpsertOrganizerProfileDto } from "./dto/organizer-profile.dto";

@Injectable()
export class OrganizerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService
  ) {}

  async upsertMyProfile(userId: string, dto: UpsertOrganizerProfileDto) {
    const profile = await this.prisma.organizerProfile.upsert({
      where: { userId },
      update: {
        displayName: dto.displayName,
        headline: dto.headline,
        servicePromiseText: dto.servicePromiseText,
        responseRate: dto.responseRate,
        completedOrdersCount: dto.completedOrdersCount,
        featuredPortfolioId: dto.featuredPortfolioId,
        featuredCaseStudyId: dto.featuredCaseStudyId
      },
      create: {
        userId,
        displayName: dto.displayName,
        headline: dto.headline,
        servicePromiseText: dto.servicePromiseText,
        responseRate: dto.responseRate,
        completedOrdersCount: dto.completedOrdersCount,
        featuredPortfolioId: dto.featuredPortfolioId,
        featuredCaseStudyId: dto.featuredCaseStudyId
      }
    });

    if (dto.tags) {
      await this.prisma.organizerProfileTag.deleteMany({
        where: { organizerProfileId: profile.id }
      });

      if (dto.tags.length > 0) {
        await this.prisma.organizerProfileTag.createMany({
          data: dto.tags.map((tag, index) => ({
            organizerProfileId: profile.id,
            tagType: tag.type,
            tagValue: tag.value.trim(),
            sortOrder: index
          }))
        });
      }
    }

    return this.getOrganizerProfile(userId);
  }

  async getMyProfile(userId: string) {
    return this.getOrganizerProfile(userId);
  }

  async getOrganizerProfile(userId: string) {
    const organizer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        serviceProfile: true,
        organizerProfile: {
          include: {
            tags: {
              orderBy: [{ tagType: "asc" }, { sortOrder: "asc" }]
            }
          }
        }
      }
    });

    if (!organizer || organizer.role !== "organizer") {
      throw new NotFoundException("Organizer not found");
    }

    const [portfolioItems, caseStudies, reviewSummary, recentReviews] = await Promise.all([
      this.prisma.portfolioItem.findMany({
        where: { userId, status: "published" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          media: {
            orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
          }
        }
      }),
      this.prisma.caseStudy.findMany({
        where: { userId, status: "published" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: {
          media: {
            orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
          }
        }
      }),
      this.reviewsService.listByOrganizer(userId),
      this.reviewsService.listByOrganizerForProfile(userId, 10)
    ]);

    return {
      organizer: {
        id: organizer.id,
        phone: organizer.phone,
        status: organizer.status,
        reputationScore: organizer.reputationScore,
        reputationLevel: organizer.reputationLevel
      },
      organizerProfile: organizer.organizerProfile,
      serviceProfile: organizer.serviceProfile,
      userProfile: organizer.profile,
      portfolioItems,
      caseStudies,
      reviews: reviewSummary,
      recentReviews
    };
  }

  async getCandidatePool(orderId: string) {
    await this.releaseExpiredCandidatePool(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const organizers = await this.prisma.user.findMany({
      where: {
        role: "organizer",
        status: "active",
        serviceProfile: {
          approvalStatus: "approved"
        }
      },
      include: {
        profile: true,
        serviceProfile: true,
        organizerProfile: {
          include: {
            tags: true
          }
        },
        portfolioItems: {
          where: { status: "published" },
          take: 3,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          include: {
            media: {
              orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
            }
          }
        },
        caseStudies: {
          where: { status: "published" },
          take: 3,
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          include: {
            media: {
              orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
            }
          }
        },
        reviewsReceived: {
          where: { role: "client_to_organizer" }
        }
      }
    });

    return organizers
      .map((organizer) => {
        const breakdown = this.buildMatchScoreBreakdown({
          query: [order.title, order.description, order.specialNotes].filter(Boolean).join(" "),
          styleTags: [],
          serviceTags: [order.cityCode],
          order,
          organizer
        });
        const reviewItems = organizer.reviewsReceived;
        const reviewAverage = reviewItems.length
          ? Number((reviewItems.reduce((sum: number, item) => sum + item.overallRating, 0) / reviewItems.length).toFixed(2))
          : 0;

        return {
          organizerId: organizer.id,
          organizer,
          portfolioItems: organizer.portfolioItems,
          caseStudies: organizer.caseStudies,
          scores: {
            reviewAverage,
            styleScore: breakdown.styleScore,
            distanceScore: breakdown.distanceScore,
            trustScore: organizer.trustScore,
            reputationScore: organizer.reputationScore,
            responseRateScore: breakdown.responseRateScore,
            totalScore: breakdown.totalScore
          },
          matchScoreBreakdown: breakdown
        };
      })
      .sort((a, b) => b.matchScoreBreakdown.totalScore - a.matchScoreBreakdown.totalScore);
  }

  async styleMatching(dto: StyleMatchingDto) {
    const organizers = await this.prisma.user.findMany({
      where: {
        role: "organizer",
        status: "active"
      },
      include: {
        profile: true,
        reviewsReceived: {
          where: { role: "client_to_organizer" }
        },
        organizerProfile: {
          include: {
            tags: true
          }
        },
        portfolioItems: {
          where: { status: "published" },
          take: 3,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
        }
      }
    });

    return organizers
      .map((organizer) => {
        const breakdown = this.buildMatchScoreBreakdown({
          query: dto.query ?? "",
          styleTags: dto.styleTags ?? [],
          serviceTags: dto.serviceTags ?? [],
          order: null,
          organizer
        });

        return {
          organizerId: organizer.id,
          nickname: organizer.profile?.nickname ?? organizer.phone,
          score: breakdown.totalScore,
          matchedTags: [...breakdown.matchedStyleTags, ...breakdown.matchedServiceTags, ...breakdown.matchedBadges],
          portfolioPreview: organizer.portfolioItems.slice(0, 3),
          matchScoreBreakdown: breakdown
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async getOrganizerShowcase(userId: string) {
    const profile = await this.getOrganizerProfile(userId);
    return {
      organizer: profile.organizer,
      organizerProfile: profile.organizerProfile,
      serviceProfile: profile.serviceProfile,
      userProfile: profile.userProfile,
      portfolioItems: profile.portfolioItems,
      caseStudies: profile.caseStudies,
      reviews: profile.reviews
    };
  }

  private buildMatchScoreBreakdown({
    query,
    styleTags,
    serviceTags,
    order,
    organizer
  }: {
    query: string;
    styleTags: string[];
    serviceTags: string[];
    order: { cityCode: string } | null;
    organizer: User & {
      organizerProfile: { responseRate: number; tags: Array<{ tagType: OrganizerProfileTagType; tagValue: string }> } | null;
      reviewsReceived?: Array<{ overallRating: number }>;
    };
  }) {
    const normalizedQuery = query.toLowerCase();
    const tagGroups = this.groupTags(organizer.organizerProfile?.tags ?? []);
    const normalizedStyle = styleTags.map((item) => item.toLowerCase());
    const normalizedService = serviceTags.map((item) => item.toLowerCase());

    const matchedStyleTags = tagGroups.style.filter((tag) => normalizedQuery.includes(tag.toLowerCase()) || normalizedStyle.includes(tag.toLowerCase()));
    const matchedServiceTags = tagGroups.service.filter((tag) => normalizedQuery.includes(tag.toLowerCase()) || normalizedService.includes(tag.toLowerCase()));
    const matchedBadges = tagGroups.badge.filter((tag) => normalizedQuery.includes(tag.toLowerCase()));

    const reviewItems = organizer.reviewsReceived ?? [];
    const averageRating = reviewItems.length
      ? reviewItems.reduce((sum, item) => sum + item.overallRating, 0) / reviewItems.length
      : 0;
    const styleScore = Math.min(35, matchedStyleTags.length * 17.5);
    const distanceScore =
      order && matchedServiceTags.some((tag) => tag.toLowerCase() === order.cityCode.toLowerCase())
        ? 15
        : matchedServiceTags.length > 0
          ? 10
          : 5;
    const reputationScore = Math.min(20, organizer.reputationScore / 75);
    const ratingScore = Math.min(15, averageRating * 3);
    const responseRateScore = Math.min(15, ((organizer.organizerProfile?.responseRate ?? 0) / 100) * 15);
    const badgeScore = Math.min(5, matchedBadges.length * 2.5);
    const totalScore = Number((styleScore + distanceScore + reputationScore + ratingScore + responseRateScore + badgeScore).toFixed(2));

    return {
      styleScore,
      distanceScore,
      reputationScore,
      ratingScore,
      responseRateScore,
      totalScore,
      matchedStyleTags,
      matchedServiceTags,
      matchedBadges
    };
  }

  private groupTags(tags: Array<{ tagType: OrganizerProfileTagType; tagValue: string }>) {
    return {
      style: tags.filter((tag) => tag.tagType === "style").map((tag) => tag.tagValue),
      service: tags.filter((tag) => tag.tagType === "service").map((tag) => tag.tagValue),
      badge: tags.filter((tag) => tag.tagType === "badge").map((tag) => tag.tagValue)
    };
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
}
