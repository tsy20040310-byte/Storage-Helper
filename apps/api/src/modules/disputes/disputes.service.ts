import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { CreateDisputeDto, SosDto } from "./dto/disputes.dto";

@Injectable()
export class DisputesService {
  create(dto: CreateDisputeDto) {
    return {
      id: randomUUID(),
      status: "open",
      ...dto
    };
  }

  sos(dto: SosDto) {
    return {
      id: randomUUID(),
      accepted: true,
      ...dto
    };
  }
}
