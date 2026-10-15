import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
  CallHandler,
  NestInterceptor,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { cacheGet, cacheSet } from '@carenest/shared-redis';
import { IDEMPOTENT_KEY, type IdempotentOptions } from '../decorators/idempotent.decorator.js';
import type { JwtUser } from '../decorators/current-user.decorator.js';

const HDR = 'idempotency-key';

/**
 * Stripe-style idempotency guard.
 *
 * Behaviour:
 * - 1st request with a key K: run handler, store the JSON response under
 *   `idemp:{scope}:{key}` with TTL.
 * - 2nd+ requests with the same K: replay the stored response. Return 409
 *   if the same K is replayed with a different request body.
 *
 * Body fingerprinting is SHA-256 of the raw body. We compare hex.
 */
@Injectable()
export class IdempotencyKeyGuard implements CanActivate, NestInterceptor {
  private static readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject('RAW_BODY_FN') private readonly rawBodyFn?: (req: Request) => Promise<string>,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    return true; // interception is the real logic
  }

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const opts = this.reflector.getAllAndOverride<IdempotentOptions>(IDEMPOTENT_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!opts) return next.handle();

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const res = ctx.switchToHttp().getResponse<Response>();
    const key = (req.headers[HDR] as string | undefined)?.trim();
    if (!key) {
      throw new BadRequestException('missing Idempotency-Key header');
    }
    if (key.length > 200 || !/^[A-Za-z0-9_.-]+$/.test(key)) {
      throw new BadRequestException('invalid Idempotency-Key');
    }

    const scope = opts.scope ?? 'user';
    let scopeId: string;
    if (scope === 'user') {
      scopeId = req.user?.sub ?? 'anon';
    } else if (scope === 'tenant') {
      scopeId = req.user?.tenantId ?? 'public';
    } else {
      scopeId = 'global';
    }
    const redisKey = `idemp:${scopeId}:${key}`;
    const ttl = opts.ttlSeconds ?? 24 * 60 * 60;

    const rawBody = this.rawBodyFn ? await this.rawBodyFn(req) : '';
    const fp = await sha256Hex(rawBody);

    const cached = await cacheGet<{ fp: string; status: number; body: unknown }>(redisKey);
    if (cached) {
      if (cached.fp !== fp) throw new ConflictException('Idempotency-Key reused with different body');
      res.setHeader('Idempotent-Replay', 'true');
      res.status(cached.status);
      return of(cached.body);
    }

    // serialise concurrent first-time requests with the same key
    const existing = IdempotencyKeyGuard.inflight.get(redisKey);
    if (existing) {
      const replayed = await existing;
      return of(replayed);
    }

    const promise = (async () => {
      const response$ = next.handle();
      return new Promise<{ status: number; body: unknown; fp: string }>((resolve, reject) => {
        response$.subscribe({
          next: (body) => resolve({ status: res.statusCode, body, fp }),
          error: (err) => reject(err),
          complete: () => {/* shouldn't happen for single-value observables */},
        });
      });
    })();

    IdempotencyKeyGuard.inflight.set(redisKey, promise);
    try {
      const result = await promise;
      await cacheSet(redisKey, result, { ttlSeconds: ttl });
      return of(result.body);
    } catch (e) {
      // do NOT cache failures — caller can retry
      throw new Error('idempotency replay failed: ' + (e as Error).message, { cause: e });
    } finally {
      IdempotencyKeyGuard.inflight.delete(redisKey);
    }
  }
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// re-export so consumers can import from the same place
export const DEFAULT_TENANT_HEADER = 'x-tenant-id';
