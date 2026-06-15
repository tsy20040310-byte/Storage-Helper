import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { VerificationsService } from "./verifications.service";
import { IdentityVerificationDto, ReviewVerificationDto } from "./dto/verifications.dto";

@Controller()
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post("verifications/identity")
  submit(@Body() dto: IdentityVerificationDto) {
    return ok(this.verificationsService.submit(dto));
  }

  @Get("verifications/identity/me")
  myStatus() {
    return ok(this.verificationsService.myStatus());
  }

  @Patch("admin/verifications/identity/:id/review")
  review(@Param("id") id: string, @Body() dto: ReviewVerificationDto) {
    return ok(this.verificationsService.review(id, dto));
  }
}
