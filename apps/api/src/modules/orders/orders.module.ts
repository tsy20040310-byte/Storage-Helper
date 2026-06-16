import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { ServiceContractsModule } from "../service-contracts/service-contracts.module";
import { OrdersController } from "./orders.controller";
import { OrdersShareController } from "./orders-share.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [PaymentsModule, ServiceContractsModule],
  controllers: [OrdersController, OrdersShareController],
  providers: [OrdersService]
})
export class OrdersModule {}
