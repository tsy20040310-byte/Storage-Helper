import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  ApplyOrderDto,
  ArrivalCheckDto,
  ClientConfirmApplicationDto,
  CompleteOrderDto,
  CreateOrderDto,
  StartOrderDto
} from "./dto/orders.dto";

@Injectable()
export class OrdersService {
  create(dto: CreateOrderDto) {
    return {
      id: randomUUID(),
      status: "published",
      ...dto
    };
  }

  list() {
    return [
      {
        id: randomUUID(),
        title: "整理衣柜和儿童玩具",
        status: "published",
        cityCode: "110100"
      }
    ];
  }

  detail(id: string) {
    return {
      id,
      title: "整理衣柜和儿童玩具",
      status: "published"
    };
  }

  apply(orderId: string, dto: ApplyOrderDto) {
    return {
      id: randomUUID(),
      orderId,
      status: "pending",
      ...dto
    };
  }

  confirmApplication(orderId: string, applicationId: string, dto: ClientConfirmApplicationDto) {
    return {
      orderId,
      applicationId,
      confirmed: dto.confirmed,
      status: "locked"
    };
  }

  arrivalCheck(orderId: string, dto: ArrivalCheckDto) {
    return {
      orderId,
      withinRadius: true,
      ...dto
    };
  }

  start(orderId: string, dto: StartOrderDto) {
    return {
      orderId,
      startPinValidated: dto.startPinCode.length === 6,
      startedAt: new Date().toISOString(),
      status: "in_service"
    };
  }

  complete(orderId: string, dto: CompleteOrderDto) {
    return {
      orderId,
      completedAt: new Date().toISOString(),
      note: dto.note,
      status: "awaiting_completion_confirmation"
    };
  }

  clientConfirmCompletion(orderId: string) {
    return {
      orderId,
      settled: true,
      status: "completed"
    };
  }
}
