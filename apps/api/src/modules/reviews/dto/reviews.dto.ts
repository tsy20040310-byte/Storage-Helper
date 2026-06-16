import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class ReviewMediaItemDto {
  @ApiProperty({ enum: ["image", "video"] })
  @IsString()
  type!: "image" | "video";

  @ApiProperty()
  @IsString()
  url!: string;
}

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  professionalScore!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  communicationScore!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityScore!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  resultScore!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [ReviewMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaItemDto)
  media?: ReviewMediaItemDto[];
}

export class CreateReviewFollowupDto {
  @ApiProperty()
  @IsString()
  content!: string;
}
