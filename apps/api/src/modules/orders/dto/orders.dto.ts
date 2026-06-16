import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class MediaItemDto {
  @ApiProperty({ enum: ["image", "video"] })
  @IsString()
  type!: "image" | "video";

  @ApiProperty()
  @IsString()
  url!: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  title!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 5000)
  description!: string;

  @ApiProperty()
  @IsString()
  cityCode!: string;

  @ApiProperty()
  @IsString()
  addressLine!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiProperty()
  @IsBoolean()
  hasElevator!: boolean;

  @ApiProperty()
  @IsDateString()
  scheduledStartAt!: string;

  @ApiProperty({ minimum: 30, maximum: 1440 })
  @IsInt()
  @Min(30)
  @Max(1440)
  estimatedDurationMinutes!: number;

  @ApiProperty({ enum: ["owned", "need_organizer_prepare", "unknown"] })
  @IsString()
  @IsIn(["owned", "need_organizer_prepare", "unknown"])
  storageSupplyStatus!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialNotes?: string;

  @ApiProperty()
  @IsBoolean()
  sameGenderOnly!: boolean;

  @ApiPropertyOptional({ enum: ["female_only", "no_preference"] })
  @IsOptional()
  @IsIn(["female_only", "no_preference"])
  genderPreference?: "female_only" | "no_preference";

  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ type: [MediaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media!: MediaItemDto[];
}

export class ApplyOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  quotedPrice?: number;
}

export class ClientConfirmApplicationDto {
  @ApiProperty()
  @IsBoolean()
  confirmed!: boolean;
}

export class ArrivalCheckDto {
  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;
}

export class StartOrderDto {
  @ApiProperty()
  @IsString()
  @Length(6, 6)
  startPinCode!: string;
}

export class CompleteOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelOrderDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}
