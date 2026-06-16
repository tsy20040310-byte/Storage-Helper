import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ok } from "../../common/api-response";
import { AuthService } from "./auth.service";
import { LoginDto, PasswordLoginDto, RegisterDto, SendCodeDto } from "./dto/auth.dto";

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

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return ok(this.authService.register(dto));
  }

  @Post("password-login")
  passwordLogin(@Body() dto: PasswordLoginDto) {
    return ok(this.authService.passwordLogin(dto));
  }

  @Post("refresh")
  refresh() {
    return ok(this.authService.refresh());
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: { sub: string } }) {
    return ok(this.authService.me(request.user.sub));
  }
}
