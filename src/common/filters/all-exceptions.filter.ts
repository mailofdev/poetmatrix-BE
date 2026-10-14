import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message:
        status >= 500
          ? 'Internal server error'
          : this.clientMessage(exception),
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${body.path} failed`,
        stack,
      );
    }

    response.status(status).json(body);
  }

  private clientMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Request failed';
    }
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }
    if (typeof payload === 'object' && payload && 'message' in payload) {
      const message = (payload as { message?: string | string[] }).message;
      if (typeof message === 'string' || Array.isArray(message)) {
        return message;
      }
    }
    return exception.message;
  }
}
