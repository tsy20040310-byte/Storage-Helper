import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";

export class MockPayDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoEscrow?: boolean = true;
}

export class CreateRefundDto {
  @ApiProperty()
  @IsString()
  @Length(2, 500)
  reason!: string;
}

export class ReviewRefundDto {
  @ApiProperty({ enum: ["approved", "rejected"] })
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateBreachRecordDto {
  @ApiProperty({
    enum: [
      "client_cancel_late",
      "client_no_show",
      "organizer_no_show",
      "organizer_late",
      "organizer_cancel_late"
    ]
  })
  @IsIn([
    "client_cancel_late",
    "client_no_show",
    "organizer_no_show",
    "organizer_late",
    "organizer_cancel_late"
  ])
  breachType!: "client_cancel_late" | "client_no_show" | "organizer_no_show" | "organizer_late" | "organizer_cancel_late";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
