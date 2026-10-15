import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Adds / propagates an X-Request-Id header so every log line and Kafka
 * event produced in the request lifetime can be traced.
 *
 * Incoming `X-Request-Id` is honoured if it matches a safe charset.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = (req.headers['x-request-id'] as string | undefined)?.trim();
    const id = incoming && /^[A-Za-z0-9_.-]{1,128}$/.test(incoming) ? incoming : randomUUID();
    (req as Request & { id?: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
