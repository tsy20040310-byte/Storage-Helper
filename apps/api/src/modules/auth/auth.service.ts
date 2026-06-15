import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { LoginDto, SendCodeDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  sendCode(dto: SendCodeDto) {
    return {
      phone: dto.phone,
      expiresInSeconds: 300,
      provider: process.env.SMS_PROVIDER ?? "mock"
    };
  }

  login(dto: LoginDto) {
    return {
      userId: randomUUID(),
      phone: dto.phone,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token"
    };
  }

  refresh() {
    return {
      accessToken: "mock-access-token-refreshed",
      refreshToken: "mock-refresh-token-refreshed"
    };
  }
}
