import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { LoginDto, SendCodeDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  sendCode(dto: SendCodeDto) {
    return {
      phone: dto.phone,
      expiresInSeconds: 300,
      debugCode: "123456",
      provider: process.env.SMS_PROVIDER ?? "mock"
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: {
        phone: dto.phone,
        role: dto.role ?? "client",
        profile: {
          create: {
            nickname: `user${dto.phone.slice(-4)}`
          }
        }
      },
      include: {
        profile: true
      }
    });

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role
    };

    return {
      user,
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
        expiresIn: "2h"
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
        expiresIn: "30d"
      })
    };
  }

  refresh() {
    return {
      accessToken: "mock-access-token-refreshed",
      refreshToken: "mock-refresh-token-refreshed"
    };
  }
}
