import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@carenest/shared-redis', () => {
  return {
    getRedis: vi.fn(() => mockRedis),
  };
});

// Minimal ioredis mock — the guard uses `multi()` + `pexpire()`.
const store = new Map<string, { count: number; expiresAt: number }>();

const mockRedis = {
  multi: () => {
    const ops: Array<() => Promise<[Error | null, unknown]>> = [];
    return {
      incr: (key: string) => {
        ops.push(async () => {
          const now = Date.now();
          const entry = store.get(key);
          if (!entry || entry.expiresAt < now) {
            store.set(key, { count: 1, expiresAt: now + 60_000 });
            return [null, 1] as [Error | null, unknown];
          }
          entry.count += 1;
          return [null, entry.count] as [Error | null, unknown];
        });
        return this;
      },
      pttl: (key: string) => {
        ops.push(async () => {
          const entry = store.get(key);
          if (!entry) return [null, -2] as [Error | null, unknown];
          const remaining = entry.expiresAt - Date.now();
          return [null, remaining > 0 ? remaining : -2] as [Error | null, unknown];
        });
        return this;
      },
      exec: async () => {
        const results: Array<[Error | null, unknown]> = [];
        for (const op of ops) {
          results.push(await op());
        }
        return results;
      },
    };
  },
  pexpire: vi.fn(async (key: string, ms: number) => {
    const entry = store.get(key);
    if (entry) entry.expiresAt = Date.now() + ms;
    return 1;
  }),
};

import { RedisThrottlerGuard } from '../src/guards/redis-throttler.guard';

const makeReq = (path: string) => ({ method: 'POST', path } as any);
const makeCtx = (req: any) => ({ switchToHttp: () => ({ getRequest: () => req }) } as any);

describe('RedisThrottlerGuard', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('first request in window returns true', async () => {
    const guard = new RedisThrottlerGuard({ keyFn: (req) => `test:${req.path}` });
    const ok = await guard.canActivate(makeCtx(makeReq('/a')));
    expect(ok).toBe(true);
  });

  it('100th request returns true (under max)', async () => {
    const guard = new RedisThrottlerGuard({ max: 100, keyFn: (req) => `test:${req.path}` });
    for (let i = 0; i < 99; i++) {
      await guard.canActivate(makeCtx(makeReq('/a')));
    }
    const ok = await guard.canActivate(makeCtx(makeReq('/a')));
    expect(ok).toBe(true);
  });

  it('101st request throws 429', async () => {
    const guard = new RedisThrottlerGuard({ max: 100, keyFn: (req) => `test:${req.path}` });
    for (let i = 0; i < 100; i++) {
      await guard.canActivate(makeCtx(makeReq('/a')));
    }
    await expect(guard.canActivate(makeCtx(makeReq('/a')))).rejects.toThrow();
  });

  it('counter is independent per key', async () => {
    const guard = new RedisThrottlerGuard({ max: 2, keyFn: (req) => `test:${req.path}` });
    expect(await guard.canActivate(makeCtx(makeReq('/a')))).toBe(true);
    expect(await guard.canActivate(makeCtx(makeReq('/a')))).toBe(true);
    await expect(guard.canActivate(makeCtx(makeReq('/a')))).rejects.toThrow();
    // /b is a different key, fresh window
    expect(await guard.canActivate(makeCtx(makeReq('/b')))).toBe(true);
  });

  it('fails open when Redis is unavailable', async () => {
    // Replace the mock with one that throws
    const redisModule = await import('@carenest/shared-redis');
    (redisModule.getRedis as any).mockImplementationOnce(() => {
      throw new Error('Redis not reachable');
    });

    const guard = new RedisThrottlerGuard({ keyFn: (req) => `test:${req.path}` });
    const ok = await guard.canActivate(makeCtx(makeReq('/a')));
    expect(ok).toBe(true);
  });
});
