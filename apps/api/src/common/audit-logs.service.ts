import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

type AuditActor = {
  id?: string | null;
  role?: string | null;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actor: AuditActor | null | undefined, action: string, resourceType: string, resourceId: string, details?: unknown) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        action,
        resourceType,
        resourceId,
        detailsJson: details ? JSON.stringify(details) : null
      }
    });
  }
}
