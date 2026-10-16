import { Injectable } from '@nestjs/common';
import { RedisThrottlerGuard } from '@carenest/nestjs-common';

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 100;

/**
 * S18: Redis-backed webhook rate limiter (replaces the in-process
 * Map from S17). Atomic `INCR` + `EXPIRE` so it works correctly
 * across multiple replicas. Fails open (allows) if Redis is
 * unreachable — see `RedisThrottlerGuard` for the trade-off.
 */
@Injectable()
export class WebhookRateLimitGuard extends RedisThrottlerGuard {
  constructor() {
    super({
      windowMs: WINDOW_MS,
      max: MAX_PER_WINDOW,
      keyFn: (req: any) => {
        // Per-gateway, per-IP bucket. The router segment is the
        // gateway name (vnpay / momo / cod) — last path segment
        // after the controller mount.
        const path = (req.path || req.url || '').split('?')[0];
        const segments = path.split('/').filter(Boolean);
        const gateway = (segments[segments.length - 1] || 'unknown').toUpperCase();
        const ip = (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
          || req.socket?.remoteAddress
          || 'unknown';
        return `webhook:${gateway}:${ip}`;
      },
    });
  }
}
