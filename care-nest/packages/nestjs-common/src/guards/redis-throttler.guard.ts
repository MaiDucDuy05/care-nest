import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { getRedis } from '@carenest/shared-redis';

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 100;

/**
 * S18: Redis-backed rate limiter (replaces the in-process Map in
 * S17's `WebhookRateLimitGuard`). Uses an atomic `INCR` + `EXPIRE`
 * so it works correctly across multiple replicas.
 *
 * **Fail-open on Redis errors.** If Redis is unreachable we log a
 * WARN and allow the request through. The rationale: the alternative
 * is fail-closed (return 503 to legitimate traffic during a Redis
 * blip), which is a worse user experience. An alert on the WARN log
 * volume is the operational mitigation.
 */
@Injectable()
export class RedisThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(RedisThrottlerGuard.name);

  constructor(
    private readonly options: {
      windowMs?: number;
      max?: number;
      /** Function to derive the bucket key from the request. Default: `method:path` */
      keyFn?: (req: any) => string;
    } = {}
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const windowMs = this.options.windowMs ?? DEFAULT_WINDOW_MS;
    const max = this.options.max ?? DEFAULT_MAX;
    const rawKey = this.options.keyFn ? this.options.keyFn(req) : `${req.method}:${req.path}`;
    const key = `throttle:${rawKey}`;

    let count: number;
    try {
      const r = getRedis();
      const tx = r.multi();
      tx.incr(key);
      tx.pttl(key);
      const results = await tx.exec();
      if (!results) throw new Error('Redis transaction returned null');
      const [[, incrRes], [, ttlRes]] = results as Array<[Error | null, number]>;
      if (incrRes == null) throw new Error('INCR returned null');
      count = incrRes;
      // Set the expiry on the FIRST request in a window (count === 1)
      // so the bucket auto-resets.
      if (count === 1 || ttlRes < 0) {
        await r.pexpire(key, windowMs);
      }
    } catch (err) {
      this.logger.warn(
        { err: (err as Error).message, key },
        'Redis unavailable — fail-open on rate limit'
      );
      return true;
    }

    if (count > max) {
      this.logger.warn({ key, count, max }, 'Rate limit exceeded');
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfterMs: windowMs,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }
}
