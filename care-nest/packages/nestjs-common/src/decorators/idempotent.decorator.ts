import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Marks an endpoint as idempotent. `IdempotencyKeyGuard` will:
 * - require header `Idempotency-Key`
 * - check Redis for a previously stored response
 * - replay it if present
 * - otherwise let the request through and store the response
 *
 * TTL is 24h (configurable per route via @Idempotent({ ttlSeconds: ... })).
 */
export interface IdempotentOptions {
  ttlSeconds?: number;
  scope?: 'user' | 'tenant' | 'global';
}
export const Idempotent = (opts: IdempotentOptions = {}): MethodDecorator =>
  SetMetadata(IDEMPOTENT_KEY, { ttlSeconds: 24 * 60 * 60, ...opts });
