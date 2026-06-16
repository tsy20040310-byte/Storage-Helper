import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

class OrganizerProfileTagDto {
  @ApiProperty({ enum: ["style", "service", "badge"] })
  @IsIn(["style", "service", "badge"])
  type!: "style" | "service" | "badge";

  @ApiProperty()
  @IsString()
  value!: string;
}

export class UpsertOrganizerProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  servicePromiseText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  responseRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  completedOrdersCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredPortfolioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  featuredCaseStudyId?: string;

  @ApiPropertyOptional({ type: [OrganizerProfileTagDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrganizerProfileTagDto)
  tags?: OrganizerProfileTagDto[];
}

export class StyleMatchingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomType?: string;
}
