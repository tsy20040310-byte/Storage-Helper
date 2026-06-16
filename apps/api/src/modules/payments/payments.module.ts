import { Module } from "@nestjs/common";
import { AuditLogsService } from "../../common/audit-logs.service";
import { PrismaModule } from "../../database/prisma.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuditLogsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
