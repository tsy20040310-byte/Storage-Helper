import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MediaService } from "../../common/media.service";
import { PrismaService } from "../../database/prisma.service";
import { CreateCaseStudyDto, CreatePortfolioItemDto, UpdateCaseStudyDto, UpdatePortfolioItemDto } from "./dto/portfolios.dto";

@Injectable()
export class PortfoliosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService
  ) {}

  async createPortfolioItem(userId: string, dto: CreatePortfolioItemDto) {
    const item = await this.prisma.portfolioItem.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        roomType: dto.roomType,
        styleTagsText: dto.styleTagsText,
        beforeSummary: dto.beforeSummary,
        status: dto.status ?? "published",
        sortOrder: dto.sortOrder ?? 0
      }
    });

    await this.replacePortfolioMedia(item.id, dto.media);
    return this.getPortfolioItem(item.id);
  }

  async listPortfolioItems(userId: string) {
    const items = await this.prisma.portfolioItem.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        media: {
          orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
        },
        caseStudies: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: {
            media: {
              orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
            }
          }
        }
      }
    });

    return items.map((item) => this.mapPortfolioItem(item));
  }

  async updatePortfolioItem(userId: string, portfolioId: string, dto: UpdatePortfolioItemDto) {
    await this.assertPortfolioOwner(userId, portfolioId);
    await this.prisma.portfolioItem.update({
      where: { id: portfolioId },
      data: {
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        roomType: dto.roomType,
        styleTagsText: dto.styleTagsText,
        beforeSummary: dto.beforeSummary,
        status: dto.status,
        sortOrder: dto.sortOrder
      }
    });
    await this.replacePortfolioMedia(portfolioId, dto.media);
    return this.getPortfolioItem(portfolioId);
  }

  async createCaseStudy(userId: string, portfolioId: string, dto: CreateCaseStudyDto) {
    await this.assertPortfolioOwner(userId, portfolioId);
    const caseStudy = await this.prisma.caseStudy.create({
      data: {
        portfolioId,
        userId,
        title: dto.title,
        problemSummary: dto.problemSummary,
        solutionSummary: dto.solutionSummary,
        resultSummary: dto.resultSummary,
        coverImageUrl: dto.coverImageUrl,
        isFeatured: dto.isFeatured ?? false,
        status: dto.status ?? "published"
      }
    });
    await this.replaceCaseStudyMedia(caseStudy.id, dto.media);
    return this.getCaseStudy(caseStudy.id);
  }

  async listCaseStudies(userId: string) {
    const items = await this.prisma.caseStudy.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: {
        media: {
          orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
        },
        portfolioItem: true
      }
    });

    return items.map((item) => this.mapCaseStudy(item));
  }

  async updateCaseStudy(userId: string, caseStudyId: string, dto: UpdateCaseStudyDto) {
    const caseStudy = await this.prisma.caseStudy.findUnique({
      where: { id: caseStudyId }
    });

    if (!caseStudy || caseStudy.deletedAt) {
      throw new NotFoundException("Case study not found");
    }

    if (caseStudy.userId !== userId) {
      throw new ForbiddenException("You do not own this case study");
    }

    await this.prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        title: dto.title,
        problemSummary: dto.problemSummary,
        solutionSummary: dto.solutionSummary,
        resultSummary: dto.resultSummary,
        coverImageUrl: dto.coverImageUrl,
        isFeatured: dto.isFeatured,
        status: dto.status
      }
    });
    await this.replaceCaseStudyMedia(caseStudyId, dto.media);
    return this.getCaseStudy(caseStudyId);
  }

  async incrementCaseStudyView(caseStudyId: string) {
    await this.assertActiveCaseStudy(caseStudyId);
    return this.prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    });
  }

  async incrementCaseStudyLike(caseStudyId: string) {
    await this.assertActiveCaseStudy(caseStudyId);
    return this.prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        likesCount: {
          increment: 1
        }
      }
    });
  }

  async incrementCaseStudyFavorite(caseStudyId: string) {
    await this.assertActiveCaseStudy(caseStudyId);
    return this.prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        favoritesCount: {
          increment: 1
        }
      }
    });
  }

  private async assertPortfolioOwner(userId: string, portfolioId: string) {
    const portfolio = await this.prisma.portfolioItem.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio || portfolio.deletedAt) {
      throw new NotFoundException("Portfolio item not found");
    }

    if (portfolio.userId !== userId) {
      throw new ForbiddenException("You do not own this portfolio item");
    }
  }

  private async replacePortfolioMedia(portfolioId: string, media?: Array<{ stage: "before" | "after"; url: string }>) {
    if (!media) {
      return;
    }

    await this.prisma.portfolioMedia.deleteMany({
      where: { portfolioItemId: portfolioId }
    });

    if (media.length === 0) {
      return;
    }

    await this.prisma.portfolioMedia.createMany({
      data: media.map((item, index) => ({
        portfolioItemId: portfolioId,
        stage: item.stage,
        url: item.url,
        fileSize: null,
        sortOrder: index
      }))
    });
  }

  private async replaceCaseStudyMedia(caseStudyId: string, media?: Array<{ stage: "before" | "after"; url: string }>) {
    if (!media) {
      return;
    }

    await this.prisma.caseStudyMedia.deleteMany({
      where: { caseStudyId }
    });

    if (media.length === 0) {
      return;
    }

    await this.prisma.caseStudyMedia.createMany({
      data: media.map((item, index) => ({
        caseStudyId,
        stage: item.stage,
        url: item.url,
        fileSize: null,
        sortOrder: index
      }))
    });
  }

  private async getPortfolioItem(portfolioId: string) {
    const item = await this.prisma.portfolioItem.findFirstOrThrow({
      where: { id: portfolioId, deletedAt: null },
      include: {
        media: {
          orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
        },
        caseStudies: {
          where: { deletedAt: null },
          include: {
            media: {
              orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
            }
          }
        }
      }
    });

    return this.mapPortfolioItem(item);
  }

  private async getCaseStudy(caseStudyId: string) {
    const item = await this.prisma.caseStudy.findFirstOrThrow({
      where: { id: caseStudyId, deletedAt: null },
      include: {
        media: {
          orderBy: [{ stage: "asc" }, { sortOrder: "asc" }]
        },
        portfolioItem: true
      }
    });

    return this.mapCaseStudy(item);
  }

  private async assertActiveCaseStudy(caseStudyId: string) {
    const caseStudy = await this.prisma.caseStudy.findUnique({ where: { id: caseStudyId } });
    if (!caseStudy || caseStudy.deletedAt) {
      throw new NotFoundException("Case study not found");
    }
  }

  private mapPortfolioItem(item: any) {
    return {
      ...item,
      media: this.mediaService.normalizeList(item.media, "image"),
      caseStudies: item.caseStudies?.map((caseStudy: any) => this.mapCaseStudy(caseStudy)) ?? []
    };
  }

  private mapCaseStudy(item: any) {
    return {
      ...item,
      media: this.mediaService.normalizeList(item.media, "image")
    };
  }
}
