import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { LoginDto, PasswordLoginDto, RegisterDto, SendCodeDto } from "./dto/auth.dto";

const scrypt = promisify(scryptCallback);

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
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: {
        profile: true
      }
    });

    const user = existingUser
      ? existingUser.deletedAt
        ? await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              deletedAt: null,
              role: dto.role ?? existingUser.role
            },
            include: {
              profile: true
            }
          })
        : existingUser
      : await this.prisma.user.create({
          data: {
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

    return {
      user,
      ...(await this.issueTokens(user))
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: {
        profile: true
      }
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException("Phone already registered");
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = existingUser?.deletedAt
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            deletedAt: null,
            role: dto.role ?? existingUser.role,
            passwordHash,
            profile: {
              upsert: {
                create: {
                  nickname: dto.nickname?.trim() || `user${dto.phone.slice(-4)}`
                },
                update: {
                  nickname: dto.nickname?.trim() || existingUser.profile?.nickname || `user${dto.phone.slice(-4)}`
                }
              }
            }
          },
          include: {
            profile: true
          }
        })
      : await this.prisma.user.create({
          data: {
            phone: dto.phone,
            role: dto.role ?? "admin",
            passwordHash,
            profile: {
              create: {
                nickname: dto.nickname?.trim() || `user${dto.phone.slice(-4)}`
              }
            }
          },
          include: {
            profile: true
          }
        });

    return {
      user,
      ...(await this.issueTokens(user))
    };
  }

  async passwordLogin(dto: PasswordLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: {
        profile: true
      }
    });

    if (!user || user.deletedAt || !user.passwordHash) {
      throw new UnauthorizedException("Invalid phone or password");
    }

    const passwordMatches = await this.verifyPassword(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid phone or password");
    }

    return {
      user,
      ...(await this.issueTokens(user))
    };
  }

  refresh() {
    return {
      accessToken: "mock-access-token-refreshed",
      refreshToken: "mock-refresh-token-refreshed"
    };
  }

  async me(userId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: { id: userId, deletedAt: null },
      include: {
        profile: true
      }
    });
  }

  private async issueTokens(user: Pick<User, "id" | "phone" | "role">) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "2h"
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d"
      })
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(password: string, passwordHash: string) {
    const [salt, storedKey] = passwordHash.split(":");
    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return timingSafeEqual(Buffer.from(storedKey, "hex"), derivedKey);
  }
}
