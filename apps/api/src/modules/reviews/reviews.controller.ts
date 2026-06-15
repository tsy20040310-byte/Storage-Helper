import { Body, Controller, Param, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/reviews.dto";

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post("orders/:id/reviews")
  create(@Param("id") id: string, @Body() dto: CreateReviewDto) {
    return ok(this.reviewsService.create(id, dto));
  }
}
