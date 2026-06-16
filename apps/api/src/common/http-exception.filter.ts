import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const { code, message, details } = this.normalizeException(exceptionResponse, status, exception);

    response.status(status).json({
      code,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }

  private normalizeException(exceptionResponse: unknown, status: number, exception: unknown) {
    if (typeof exceptionResponse === "string") {
      return {
        code: `HTTP_${status}`,
        message: exceptionResponse,
        details: null
      };
    }

    if (exceptionResponse && typeof exceptionResponse === "object") {
      const response = exceptionResponse as Record<string, unknown>;
      const message = typeof response.message === "string" ? response.message : "Validation failed";
      const details = response.details ?? (Array.isArray(response.message) ? response.message : null);
      return {
        code: String(response.code ?? `HTTP_${status}`),
        message,
        details
      };
    }

    return {
      code: `HTTP_${status}`,
      message: exception instanceof Error ? exception.message : "Internal server error",
      details: null
    };
  }
}
