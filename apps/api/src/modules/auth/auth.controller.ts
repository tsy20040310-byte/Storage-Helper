import { Body, Controller, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { AuthService } from "./auth.service";
import { LoginDto, SendCodeDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-code")
  sendCode(@Body() dto: SendCodeDto) {
    return ok(this.authService.sendCode(dto));
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return ok(this.authService.login(dto));
  }

  @Post("refresh")
  refresh() {
    return ok(this.authService.refresh());
  }
}
