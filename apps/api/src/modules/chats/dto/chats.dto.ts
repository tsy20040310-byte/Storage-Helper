import { IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @IsString()
  messageType!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
