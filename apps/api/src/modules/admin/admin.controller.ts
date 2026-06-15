import { Controller, Get } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard/overview")
  overview() {
    return ok(this.adminService.overview());
  }

  @Get("users")
  users() {
    return ok(this.adminService.users());
  }

  @Get("organizers")
  organizers() {
    return ok(this.adminService.organizers());
  }

  @Get("orders")
  orders() {
    return ok(this.adminService.orders());
  }

  @Get("disputes")
  disputes() {
    return ok(this.adminService.disputes());
  }

  @Get("finance/summary")
  financeSummary() {
    return ok(this.adminService.financeSummary());
  }
}
