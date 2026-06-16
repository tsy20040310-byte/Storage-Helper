import { Module } from "@nestjs/common";
import { PrismaModule } from "../../database/prisma.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { OrganizerProfileController } from "./organizer-profile.controller";
import { OrganizerProfileService } from "./organizer-profile.service";

@Module({
  imports: [PrismaModule, ReviewsModule],
  controllers: [OrganizerProfileController],
  providers: [OrganizerProfileService]
})
export class OrganizerProfileModule {}
