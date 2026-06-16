import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../common/api-response";
import { AuthenticatedUser, CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { OrdersService } from "./orders.service";

@ApiTags("orders-share")
@Controller()
export class OrdersShareController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post("orders/:id/share-link")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Generate read-only order share link" })
  createShareLink(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.ordersService.createShareLink(user, id));
  }

  @Get("public/orders/share/:token")
  @ApiOperation({ summary: "Read-only shared order status" })
  getSharedOrder(@Param("token") token: string) {
    return ok(this.ordersService.getSharedOrder(token));
  }
}
