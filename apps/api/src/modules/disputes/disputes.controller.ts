import { Body, Controller, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { DisputesService } from "./disputes.service";
import { CreateDisputeDto, SosDto } from "./dto/disputes.dto";

@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post("disputes")
  create(@Body() dto: CreateDisputeDto) {
    return ok(this.disputesService.create(dto));
  }

  @Post("sos")
  sos(@Body() dto: SosDto) {
    return ok(this.disputesService.sos(dto));
  }
}
