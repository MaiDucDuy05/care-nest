/**
 * Redis-based distributed lock (SET NX EX + Lua release).
 *
 * Use to serialize access to a shared resource across multiple service
 * instances (e.g. "only one worker may process this order's inventory
 * reservation").
 */

import { randomUUID } from 'node:crypto';
import { getRedis } from './redis-client.js';

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export interface LockOptions {
  /** TTL in ms (auto-release if the holder dies). Default 30_000 */
  ttlMs?: number;
  /** max time to wait for the lock. Default 0 (fail immediately) */
  waitTimeoutMs?: number;
  /** retry interval while waiting. Default 100ms */
  retryMs?: number;
}

export class LockNotAcquiredError extends Error {
  constructor(public readonly key: string) {
    super(`Could not acquire lock on "${key}"`);
    this.name = 'LockNotAcquiredError';
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn` while holding the lock on `key`. Releases the lock on resolve
 * or reject. Throws `LockNotAcquiredError` if the lock can't be acquired
 * within `waitTimeoutMs`.
 */
export async function withLock<T>(key: string, fn: () => Promise<T>, options: LockOptions = {}): Promise<T> {
  const ttlMs = options.ttlMs ?? 30_000;
  const waitTimeoutMs = options.waitTimeoutMs ?? 0;
  const retryMs = options.retryMs ?? 100;
  const token = randomUUID();
  const start = Date.now();

  // Loop until we acquire the lock or exhaust `waitTimeoutMs`.
  // `eslint-disable-next-line no-constant-condition` is intentional: we
  // genuinely don't know the iteration count up front — depends on the
  // other holder's runtime.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ok = await getRedis().set(key, token, 'PX', ttlMs, 'NX');
    if (ok === 'OK') break;
    if (Date.now() - start >= waitTimeoutMs) {
      throw new LockNotAcquiredError(key);
    }
    await sleep(retryMs);
  }

  try {
    return await fn();
  } finally {
    // Only release if we still own the lock (token must match)
    await getRedis().eval(RELEASE_SCRIPT, 1, key, token).catch(() => {});
  }
}
