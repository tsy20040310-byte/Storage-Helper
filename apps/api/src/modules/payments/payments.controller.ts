import { Controller, Param, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { PaymentsService } from "./payments.service";

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("payments/orders/:id/prepay")
  prepay(@Param("id") id: string) {
    return ok(this.paymentsService.prepay(id));
  }

  @Post("payments/webhooks/provider")
  webhook() {
    return ok(this.paymentsService.webhook());
  }

  @Post("admin/payouts/:id/settle")
  settle(@Param("id") id: string) {
    return ok(this.paymentsService.settle(id));
  }
}
