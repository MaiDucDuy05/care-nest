import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../modules/metrics.module.js';

/**
 * Records `http_request_duration_seconds` for every HTTP response.
 * Labels: method, route (the route template, not the resolved URL —
 * `/users/:id` not `/users/abc123`), status (HTTP code).
 *
 * Mount via `configure(consumer)` in your AppModule:
 * ```ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(RequestMetricsMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestMetricsMiddleware implements NestMiddleware {
  constructor(@Inject(MetricsService) private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      // `req.route` is set by NestJS routing AFTER dispatch; on 404
      // it's undefined, so fall back to the request path.
      const route = (req as any).route?.path ?? req.path ?? 'unknown';
      this.metrics.observe('http_request_duration_seconds', seconds, {
        method: req.method,
        route,
        status: String(res.statusCode),
      });
    });
    next();
  }
}
