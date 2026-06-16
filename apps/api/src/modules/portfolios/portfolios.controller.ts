import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { CreateCaseStudyDto, CreatePortfolioItemDto, UpdateCaseStudyDto, UpdatePortfolioItemDto } from "./dto/portfolios.dto";
import { PortfoliosService } from "./portfolios.service";

@ApiTags("portfolios")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post("portfolios")
  @Roles("organizer")
  @ApiOperation({ summary: "Create organizer portfolio item" })
  createPortfolioItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePortfolioItemDto) {
    return ok(this.portfoliosService.createPortfolioItem(user.sub, dto));
  }

  @Get("portfolios/me")
  @Roles("organizer")
  @ApiOperation({ summary: "List current organizer portfolio items" })
  listMyPortfolioItems(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.portfoliosService.listPortfolioItems(user.sub));
  }

  @Patch("portfolios/:id")
  @Roles("organizer")
  @ApiOperation({ summary: "Update organizer portfolio item" })
  updatePortfolioItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdatePortfolioItemDto
  ) {
    return ok(this.portfoliosService.updatePortfolioItem(user.sub, id, dto));
  }

  @Post("portfolios/:id/case-studies")
  @Roles("organizer")
  @ApiOperation({ summary: "Create case study under a portfolio item" })
  createCaseStudy(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateCaseStudyDto) {
    return ok(this.portfoliosService.createCaseStudy(user.sub, id, dto));
  }

  @Get("case-studies/me")
  @Roles("organizer")
  @ApiOperation({ summary: "List current organizer case studies" })
  listMyCaseStudies(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.portfoliosService.listCaseStudies(user.sub));
  }

  @Patch("case-studies/:id")
  @Roles("organizer")
  @ApiOperation({ summary: "Update current organizer case study" })
  updateCaseStudy(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCaseStudyDto) {
    return ok(this.portfoliosService.updateCaseStudy(user.sub, id, dto));
  }

  @Post("case-studies/:id/view")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Increment case study views" })
  incrementView(@Param("id") id: string) {
    return ok(this.portfoliosService.incrementCaseStudyView(id));
  }

  @Post("case-studies/:id/like")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Increment case study likes" })
  incrementLike(@Param("id") id: string) {
    return ok(this.portfoliosService.incrementCaseStudyLike(id));
  }

  @Post("case-studies/:id/favorite")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Increment case study favorites" })
  incrementFavorite(@Param("id") id: string) {
    return ok(this.portfoliosService.incrementCaseStudyFavorite(id));
  }
}
