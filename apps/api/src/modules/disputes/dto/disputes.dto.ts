import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Length } from "class-validator";

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  subject!: string;

  @ApiProperty()
  @IsString()
  @Length(5, 5000)
  description!: string;
}

export class CreateDisputeMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 5000)
  message!: string;
}

export class CreateDisputeEvidenceDto {
  @ApiProperty({ enum: ["image", "video", "file"] })
  @IsIn(["image", "video", "file"])
  evidenceType!: "image" | "video" | "file";

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class SosDto {
  @ApiProperty()
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSosStatusDto {
  @ApiProperty({ enum: ["processing", "resolved"] })
  @IsIn(["processing", "resolved"])
  status!: "processing" | "resolved";
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ["complaint_upheld", "harassment", "severe_violation", "no_fault", "settlement"] })
  @IsIn(["complaint_upheld", "harassment", "severe_violation", "no_fault", "settlement"])
  resolutionType!: "complaint_upheld" | "harassment" | "severe_violation" | "no_fault" | "settlement";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
