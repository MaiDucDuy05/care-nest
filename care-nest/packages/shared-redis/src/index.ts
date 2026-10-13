/**
 * @carenest/shared-redis
 *
 * ioredis wrapper with CareNest conventions:
 * - one Redis client per process (singleton, lazy)
 * - JSON helpers (`cacheGet`, `cacheSet`)
 * - distributed lock with safe release (`withLock`)
 * - graceful shutdown via `disconnectRedis()`
 */

export * from './redis-client.js';
export * from './cache.js';
export * from './lock.js';
