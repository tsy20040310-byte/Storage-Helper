import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ok } from "../../common/api-response";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { OrdersService } from "./orders.service";
import {
  ApplyOrderDto,
  ArrivalCheckDto,
  CancelOrderDto,
  ClientConfirmApplicationDto,
  CompleteOrderDto,
  CreateOrderDto,
  StartOrderDto
} from "./dto/orders.dto";

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles("client", "admin")
  @ApiOperation({ summary: "Create order" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return ok(this.ordersService.create(user.sub, dto));
  }

  @Get()
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "List orders visible to current user" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.ordersService.list(user));
  }

  @Get(":id")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Get order detail" })
  detail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.ordersService.detail(user, id));
  }

  @Post(":id/applications")
  @Roles("organizer", "admin")
  @ApiOperation({ summary: "Apply for an order" })
  apply(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ApplyOrderDto) {
    return ok(this.ordersService.apply(user.sub, id, dto));
  }

  @Patch(":id/applications/:applicationId/confirm")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Confirm organizer application and lock order" })
  confirmApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("applicationId") applicationId: string,
    @Body() dto: ClientConfirmApplicationDto
  ) {
    return ok(this.ordersService.confirmApplication(user, id, applicationId, dto));
  }

  @Post(":id/arrival-check")
  @Roles("organizer", "admin")
  @ApiOperation({ summary: "Verify organizer arrival by GPS" })
  arrivalCheck(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ArrivalCheckDto) {
    return ok(this.ordersService.arrivalCheck(user, id, dto));
  }

  @Post(":id/start")
  @Roles("organizer", "admin")
  @ApiOperation({ summary: "Start service after PIN verification" })
  start(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: StartOrderDto) {
    return ok(this.ordersService.start(user, id, dto));
  }

  @Post(":id/complete")
  @Roles("organizer", "admin")
  @ApiOperation({ summary: "Complete service and wait for client confirmation" })
  complete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CompleteOrderDto) {
    return ok(this.ordersService.complete(user, id, dto));
  }

  @Post(":id/client-confirm-completion")
  @Roles("client", "admin")
  @ApiOperation({ summary: "Client confirms completion and starts 12h observation" })
  clientConfirmCompletion(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return ok(this.ordersService.clientConfirmCompletion(user, id));
  }

  @Post(":id/cancel")
  @Roles("client", "organizer", "admin")
  @ApiOperation({ summary: "Cancel order and create refund workflow if needed" })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return ok(this.ordersService.cancel(user, id, dto));
  }
}
