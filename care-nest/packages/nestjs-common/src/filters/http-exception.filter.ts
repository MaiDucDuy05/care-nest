import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Standard error envelope:
 *   { error: { code, message, details?, path, timestamp, requestId } }
 *
 * All services MUST return errors in this shape so the front-end can render
 * them uniformly.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { headers: Record<string, string | string[] | undefined> }>();
    const reqId = (req.headers['x-request-id'] as string | undefined) ?? null;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as { message?: string | string[]; error?: string; code?: string };
        message = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? exception.message);
        code = b.code ?? httpStatusToCode(status);
        details = b;
      }
      if (code === 'INTERNAL_ERROR') code = httpStatusToCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.log.error(exception.stack ?? exception.message);
    } else {
      this.log.error(`non-Error thrown: ${String(exception)}`);
    }

    res.status(status).json({
      error: {
        code,
        message,
        details,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        requestId: reqId,
      },
    });
  }
}

function httpStatusToCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'UNPROCESSABLE_ENTITY';
    case 429: return 'RATE_LIMITED';
    default: return status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR';
  }
}
