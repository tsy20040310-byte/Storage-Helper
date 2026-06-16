import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard/overview")
  @ApiOperation({ summary: "Admin overview metrics" })
  overview() {
    return ok(this.adminService.overview());
  }

  @Get("users")
  @ApiOperation({ summary: "List users for admin" })
  users() {
    return ok(this.adminService.users());
  }

  @Get("organizers")
  @ApiOperation({ summary: "List organizers for admin" })
  organizers() {
    return ok(this.adminService.organizers());
  }

  @Get("orders")
  @ApiOperation({ summary: "List orders for admin" })
  orders() {
    return ok(this.adminService.orders());
  }

  @Get("disputes")
  @ApiOperation({ summary: "List disputes for admin" })
  disputes() {
    return ok(this.adminService.disputes());
  }

  @Get("sos-events")
  @ApiOperation({ summary: "List SOS events for admin" })
  sosEvents() {
    return ok(this.adminService.sosEvents());
  }

  @Get("risk-center/summary")
  @ApiOperation({ summary: "Risk center summary" })
  riskSummary() {
    return ok(this.adminService.riskSummary());
  }

  @Get("risk-center/users")
  @ApiOperation({ summary: "Risk users" })
  riskUsers() {
    return ok(this.adminService.riskUsers());
  }

  @Get("risk-center/organizers")
  @ApiOperation({ summary: "Risk organizers" })
  riskOrganizers() {
    return ok(this.adminService.riskOrganizers());
  }

  @Get("risk-center/orders")
  @ApiOperation({ summary: "High risk orders" })
  riskOrders() {
    return ok(this.adminService.riskOrders());
  }

  @Get("finance/summary")
  @ApiOperation({ summary: "Admin finance summary" })
  financeSummary() {
    return ok(this.adminService.financeSummary());
  }

  @Get("audit-logs")
  @ApiOperation({ summary: "List audit logs" })
  auditLogs() {
    return ok(this.adminService.auditLogs());
  }
}
