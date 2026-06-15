import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { IdentityVerificationDto, ReviewVerificationDto } from "./dto/verifications.dto";

@Injectable()
export class VerificationsService {
  submit(dto: IdentityVerificationDto) {
    return {
      id: randomUUID(),
      status: "pending",
      ...dto
    };
  }

  myStatus() {
    return {
      status: "pending"
    };
  }

  review(id: string, dto: ReviewVerificationDto) {
    return {
      id,
      ...dto
    };
  }
}
