import { IsOptional, IsString } from "class-validator";

export class CreateDisputeDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  disputeType!: string;

  @IsString()
  description!: string;
}

export class SosDto {
  @IsString()
  orderId!: string;

  @IsString()
  latitude!: string;

  @IsString()
  longitude!: string;
}
