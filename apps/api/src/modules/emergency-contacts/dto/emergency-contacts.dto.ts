import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateEmergencyContactDto {
  @ApiProperty()
  @IsString()
  @Length(1, 60)
  name!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 20)
  phone!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 60)
  relation!: string;
}

export class UpdateEmergencyContactDto extends CreateEmergencyContactDto {}
