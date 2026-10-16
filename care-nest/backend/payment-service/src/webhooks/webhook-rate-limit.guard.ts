import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 100;

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory token bucket per (gateway, ip). S17 ships a simple
 * limiter; S18 (observability sprint) will swap this for a Redis
 * bucket so it survives restarts and works across replicas.
 */
@Injectable()
export class WebhookRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(WebhookRateLimitGuard.name);
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    // Per-gateway, per-IP bucket. The router segment is the gateway
    // name (vnpay / momo / cod) — first path segment after the
    // controller mount.
    const path = (req.path || req.url || '').split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const gateway = (segments[segments.length - 1] || 'unknown').toUpperCase();
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';
    const key = `${gateway}:${ip}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      this.buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    bucket.count += 1;
    if (bucket.count > MAX_PER_WINDOW) {
      this.logger.warn({ key, count: bucket.count }, 'Webhook rate limit exceeded');
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Rate limit exceeded' },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }
}
