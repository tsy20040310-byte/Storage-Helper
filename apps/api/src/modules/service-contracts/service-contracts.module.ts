import { Module } from "@nestjs/common";
import { PrismaModule } from "../../database/prisma.module";
import { ServiceContractsController } from "./service-contracts.controller";
import { ServiceContractsService } from "./service-contracts.service";

@Module({
  imports: [PrismaModule],
  controllers: [ServiceContractsController],
  providers: [ServiceContractsService],
  exports: [ServiceContractsService]
})
export class ServiceContractsModule {}
