import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class PortfolioMediaItemDto {
  @ApiProperty({ enum: ["before", "after"] })
  @IsIn(["before", "after"])
  stage!: "before" | "after";

  @ApiProperty()
  @IsString()
  url!: string;
}

class CaseStudyMediaItemDto {
  @ApiProperty({ enum: ["before", "after"] })
  @IsIn(["before", "after"])
  stage!: "before" | "after";

  @ApiProperty()
  @IsString()
  url!: string;
}

export class CreatePortfolioItemDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  title!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 3000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ description: "Comma separated tags" })
  @IsOptional()
  @IsString()
  styleTagsText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  beforeSummary?: string;

  @ApiPropertyOptional({ enum: ["draft", "published", "archived"] })
  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [PortfolioMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PortfolioMediaItemDto)
  media?: PortfolioMediaItemDto[];
}

export class UpdatePortfolioItemDto extends CreatePortfolioItemDto {}

export class CreateCaseStudyDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  title!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 3000)
  problemSummary!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 3000)
  solutionSummary!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resultSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: ["draft", "published", "archived"] })
  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @ApiPropertyOptional({ type: [CaseStudyMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CaseStudyMediaItemDto)
  media?: CaseStudyMediaItemDto[];
}

export class UpdateCaseStudyDto extends CreateCaseStudyDto {}
