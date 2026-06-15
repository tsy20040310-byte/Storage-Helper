import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { CreateReviewDto } from "./dto/reviews.dto";

@Injectable()
export class ReviewsService {
  create(orderId: string, dto: CreateReviewDto) {
    return {
      id: randomUUID(),
      orderId,
      ...dto
    };
  }
}
