import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
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
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return ok(this.ordersService.create(dto));
  }

  @Get()
  list() {
    return ok(this.ordersService.list());
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return ok(this.ordersService.detail(id));
  }

  @Post(":id/applications")
  apply(@Param("id") id: string, @Body() dto: ApplyOrderDto) {
    return ok(this.ordersService.apply(id, dto));
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
