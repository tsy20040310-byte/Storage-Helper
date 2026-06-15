import { IsIn, IsMobilePhone, IsOptional, IsString, Length } from "class-validator";

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
