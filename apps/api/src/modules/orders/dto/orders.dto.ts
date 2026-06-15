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

class MediaItemDto {
  @IsString()
  type!: "image" | "video";

  @IsString()
  url!: string;
}

export class CreateOrderDto {
  @IsString()
  @Length(2, 120)
  title!: string;

  @IsString()
  @Length(10, 5000)
  description!: string;

  @IsString()
  cityCode!: string;

  @IsString()
  addressLine!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsBoolean()
  hasElevator!: boolean;

  @IsDateString()
  scheduledStartAt!: string;

  @IsInt()
  @Min(30)
  @Max(1440)
  estimatedDurationMinutes!: number;

  @IsString()
  @IsIn(["owned", "need_organizer_prepare", "unknown"])
  storageSupplyStatus!: string;

  @IsOptional()
  @IsString()
  specialNotes?: string;

  @IsBoolean()
  sameGenderOnly!: boolean;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media!: MediaItemDto[];
}

export class ApplyOrderDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  quotedPrice?: number;
}

export class ClientConfirmApplicationDto {
  @IsBoolean()
  confirmed!: boolean;
}

export class ArrivalCheckDto {
  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

export class StartOrderDto {
  @IsString()
  @Length(6, 6)
  startPinCode!: string;
}

export class CompleteOrderDto {
  @IsOptional()
  @IsString()
  note?: string;
}
