import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { ServiceContractsService } from "./service-contracts.service";

@ApiTags("service-contracts")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceContractsController {
  constructor(private readonly serviceContractsService: ServiceContractsService) {}

  @Get("orders/:id/service-contract")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Get service contract by order" })
  getByOrder(@Param("id") id: string) {
    return ok(this.serviceContractsService.getByOrder(id));
  }

  @Get("admin/service-contracts")
  @Roles("admin")
  @ApiOperation({ summary: "List service contracts for admin" })
  listAll() {
    return ok(this.serviceContractsService.listAll());
  }
}
