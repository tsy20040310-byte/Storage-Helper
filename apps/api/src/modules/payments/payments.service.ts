import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentsService {
  prepay(orderId: string) {
    return {
      orderId,
      provider: process.env.PAYMENT_PROVIDER ?? "mock",
      status: "escrowed"
    };
  }

  webhook() {
    return {
      accepted: true
    };
  }

  settle(payoutId: string) {
    return {
      payoutId,
      status: "paid"
    };
  }
}
