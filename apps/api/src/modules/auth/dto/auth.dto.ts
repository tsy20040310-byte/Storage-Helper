import { IsIn, IsMobilePhone, IsOptional, IsString, Length, MinLength } from "class-validator";

export class SendCodeDto {
  @IsMobilePhone("zh-CN")
  phone!: string;
}

export class LoginDto {
  @IsMobilePhone("zh-CN")
  phone!: string;

  @IsString()
  @Length(4, 6)
  code!: string;

  @IsOptional()
  @IsIn(["client", "organizer", "admin"])
  role?: "client" | "organizer" | "admin";
}

export class RegisterDto {
  @IsMobilePhone("zh-CN")
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  nickname?: string;

  @IsOptional()
  @IsIn(["client", "organizer", "admin"])
  role?: "client" | "organizer" | "admin";
}

export class PasswordLoginDto {
  @IsMobilePhone("zh-CN")
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
