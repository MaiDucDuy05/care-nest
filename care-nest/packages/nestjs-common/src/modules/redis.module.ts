import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { getRedis, disconnectRedis } from '@carenest/shared-redis';
import { DEFAULT_REDIS } from '../tokens.js';

/**
 * Global RedisModule — exposes the shared ioredis client.
 *
 * For convenience `getRedis()` is also re-exported so callers can
 * use raw ioredis commands when the typed cache wrapper is too narrow.
 */
@Global()
@Module({
  providers: [
    {
      provide: DEFAULT_REDIS,
      useFactory: () => getRedis(),
    },
  ],
  exports: [DEFAULT_REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await disconnectRedis();
  }
}
