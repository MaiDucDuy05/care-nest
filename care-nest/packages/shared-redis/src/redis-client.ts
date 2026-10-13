/**
 * Singleton ioredis client.
 */

import { Redis, type RedisOptions } from 'ioredis';
import { loadRedisEnv } from '@carenest/shared-config';

let client: Redis | undefined;

export function getRedis(): Redis {
  if (client) return client;
  const env = loadRedisEnv();
  const opts: RedisOptions = {
    // ioredis parses the URL itself, but allow overrides via the options object
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  };
  if (env.REDIS_TLS) {
    opts.tls = { rejectUnauthorized: false };
  }
  client = new Redis(env.REDIS_URL, opts);
  return client;
}

/** Disconnect the singleton — call from graceful shutdown. */
export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {});
    client = undefined;
  }
}
