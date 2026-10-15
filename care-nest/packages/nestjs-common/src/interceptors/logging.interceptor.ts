import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { createLogger } from '@carenest/shared-utils';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly log = createLogger({ service: 'http' });

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & { user?: { sub?: string } }>();
    const res = http.getResponse<Response & { statusCode: number }>();
    const start = Date.now();
    const reqId = (req.headers['x-request-id'] as string | undefined) ?? 'no-req-id';
    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.log.info(
            { reqId, method: req.method, path: req.originalUrl, status: res.statusCode, ms, userId: req.user?.sub },
            'http',
          );
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.log.warn(
            { reqId, method: req.method, path: req.originalUrl, err: err.message, ms },
            'http-err',
          );
        },
      }),
    );
  }
}
