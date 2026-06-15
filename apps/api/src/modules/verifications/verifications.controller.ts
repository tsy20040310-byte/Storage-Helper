import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, AuthenticatedUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ok } from "../../common/api-response";
import { VerificationsService } from "./verifications.service";
import { IdentityVerificationDto, ReviewVerificationDto } from "./dto/verifications.dto";

@Controller()
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post("verifications/identity")
  @UseGuards(JwtAuthGuard)
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: IdentityVerificationDto) {
    return ok(this.verificationsService.submit(user.sub, dto));
  }

  @Get("verifications/identity/me")
  @UseGuards(JwtAuthGuard)
  myStatus(@CurrentUser() user: AuthenticatedUser) {
    return ok(this.verificationsService.myStatus(user.sub));
  }

  @Patch("admin/verifications/identity/:id/review")
  review(@Param("id") id: string, @Body() dto: ReviewVerificationDto) {
    return ok(this.verificationsService.review(id, dto));
  }
}
