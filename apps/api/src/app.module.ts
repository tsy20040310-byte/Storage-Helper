import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { VerificationsModule } from "./modules/verifications/verifications.module";
import { ChatsModule } from "./modules/chats/chats.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { AdminModule } from "./modules/admin/admin.module";
import { DisputesModule } from "./modules/disputes/disputes.module";
import { PrismaModule } from "./database/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env"
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    VerificationsModule,
    ChatsModule,
    PaymentsModule,
    ReviewsModule,
    AdminModule,
    DisputesModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
