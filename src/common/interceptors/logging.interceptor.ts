import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth-user.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthUser }
    >();
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(request, context, started),
        error: () => this.write(request, context, started),
      }),
    );
  }

  private write(
    request: Request & { user?: AuthUser },
    context: ExecutionContext,
    started: number,
  ): void {
    const response = context.switchToHttp().getResponse<Response>();
    const userId = request.user?.id ?? '-';
    this.logger.log(
      `${request.method} ${request.originalUrl ?? request.url} ${response.statusCode} ${Date.now() - started}ms user=${userId}`,
    );
  }
}
