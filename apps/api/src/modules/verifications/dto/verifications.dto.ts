import { IsIn, IsMobilePhone, IsString } from "class-validator";

export class IdentityVerificationDto {
  @IsString()
  fullName!: string;

  @IsString()
  idNumber!: string;

  @IsMobilePhone("zh-CN")
  phone!: string;

  @IsString()
  @IsIn(["male", "female", "other"])
  gender!: string;
}

export class ReviewVerificationDto {
  @IsIn(["approved", "rejected"])
  reviewStatus!: "approved" | "rejected";

  @IsString()
  note!: string;
}
