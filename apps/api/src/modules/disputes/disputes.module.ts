import { Module } from "@nestjs/common";
import { AuditLogsService } from "../../common/audit-logs.service";
import { MediaService } from "../../common/media.service";
import { PrismaModule } from "../../database/prisma.module";
import { DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";

@Module({
  imports: [PrismaModule],
  controllers: [DisputesController],
  providers: [DisputesService, AuditLogsService, MediaService],
  exports: [DisputesService]
})
export class DisputesModule {}
