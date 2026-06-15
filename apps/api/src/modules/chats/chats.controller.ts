import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ok } from "../../common/api-response";
import { ChatsService } from "./chats.service";
import { SendMessageDto } from "./dto/chats.dto";

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  list() {
    return ok(this.chatsService.list());
  }

  @Get(":id/messages")
  messages(@Param("id") id: string) {
    return ok(this.chatsService.messages(id));
  }

  @Post(":id/messages")
  send(@Param("id") id: string, @Body() dto: SendMessageDto) {
    return ok(this.chatsService.send(id, dto));
  }
}
