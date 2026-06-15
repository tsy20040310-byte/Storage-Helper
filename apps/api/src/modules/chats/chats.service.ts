import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { SendMessageDto } from "./dto/chats.dto";

@Injectable()
export class ChatsService {
  list() {
    return [];
  }

  messages(id: string) {
    return {
      chatId: id,
      items: []
    };
  }

  send(id: string, dto: SendMessageDto) {
    return {
      id: randomUUID(),
      chatId: id,
      ...dto
    };
  }
}
