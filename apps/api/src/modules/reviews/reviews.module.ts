import { Module } from "@nestjs/common";
import { MediaService } from "../../common/media.service";
import { PrismaModule } from "../../database/prisma.module";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, MediaService],
  exports: [ReviewsService]
})
export class ReviewsModule {}
