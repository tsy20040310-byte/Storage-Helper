import { randomUUID } from "node:crypto";

export function ok<T>(data: T, message = "ok") {
  return {
    code: 0,
    message,
    data,
    requestId: randomUUID()
  };
}
