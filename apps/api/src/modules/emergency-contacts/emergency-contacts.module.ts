import { Module } from "@nestjs/common";
import { PrismaModule } from "../../database/prisma.module";
import { EmergencyContactsController } from "./emergency-contacts.controller";
import { EmergencyContactsService } from "./emergency-contacts.service";

@Module({
  imports: [PrismaModule],
  controllers: [EmergencyContactsController],
  providers: [EmergencyContactsService]
})
export class EmergencyContactsModule {}
