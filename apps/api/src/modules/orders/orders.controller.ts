import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, AuthenticatedUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ok } from "../../common/api-response";
import { OrdersService } from "./orders.service";
import {
  ApplyOrderDto,
  ArrivalCheckDto,
  ClientConfirmApplicationDto,
  CompleteOrderDto,
  CreateOrderDto,
  StartOrderDto
} from "./dto/orders.dto";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return ok(this.ordersService.create(user.sub, dto));
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.ordersService.list(user));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return ok(this.ordersService.detail(id));
  }

  @Post(":id/applications")
  apply(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ApplyOrderDto) {
    return ok(this.ordersService.apply(user.sub, id, dto));
  }

  @Patch(":id/applications/:applicationId/confirm")
  confirmApplication(
    @Param("id") id: string,
    @Param("applicationId") applicationId: string,
    @Body() dto: ClientConfirmApplicationDto
  ) {
    return ok(this.ordersService.confirmApplication(id, applicationId, dto));
  }

  @Post(":id/arrival-check")
  arrivalCheck(@Param("id") id: string, @Body() dto: ArrivalCheckDto) {
    return ok(this.ordersService.arrivalCheck(id, dto));
  }

  @Post(":id/start")
  start(@Param("id") id: string, @Body() dto: StartOrderDto) {
    return ok(this.ordersService.start(id, dto));
  }

  @Post(":id/complete")
  complete(@Param("id") id: string, @Body() dto: CompleteOrderDto) {
    return ok(this.ordersService.complete(id, dto));
  }

  @Post(":id/client-confirm-completion")
  clientConfirmCompletion(@Param("id") id: string) {
    return ok(this.ordersService.clientConfirmCompletion(id));
  }
}
