import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { CurrentUser, AuthenticatedUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { CreateReviewDto, CreateReviewFollowupDto } from "./dto/reviews.dto";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post("orders/:id/reviews")
  @Roles("client", "organizer")
  @ApiOperation({ summary: "Create a review for an order" })
  create(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateReviewDto) {
    return ok(this.reviewsService.create(user, id, dto));
  }

  @Post("reviews/:id/followups")
  @Roles("client", "organizer")
  @ApiOperation({ summary: "Create a follow-up for a review" })
  createFollowup(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateReviewFollowupDto) {
    return ok(this.reviewsService.createFollowup(user, id, dto));
  }

  @Get("orders/:id/reviews")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List reviews for an order" })
  list(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.reviewsService.listByOrder(user, id));
  }

  @Get("organizers/:id/reviews")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List reviews for an organizer" })
  listByOrganizer(@Param("id") id: string) {
    return ok(this.reviewsService.listByOrganizer(id));
  }
}
