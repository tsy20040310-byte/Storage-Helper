import { Module } from "@nestjs/common";
import { MediaService } from "../../common/media.service";
import { PrismaModule } from "../../database/prisma.module";
import { PortfoliosController } from "./portfolios.controller";
import { PortfoliosService } from "./portfolios.service";

@Module({
  imports: [PrismaModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService, MediaService]
})
export class PortfoliosModule {}
