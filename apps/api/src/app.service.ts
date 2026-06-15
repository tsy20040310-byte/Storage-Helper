import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  health() {
    return {
      code: 0,
      message: "ok",
      data: {
        service: "storage-helper-api",
        status: "healthy",
        timestamp: new Date().toISOString()
      }
    };
  }
}
