/**
 * JSON-encoded cache helpers.
 */

import { getRedis } from './redis-client.js';

export interface CacheGetOptions {
  /** treat the value as JSON; default true */
  parseJson?: boolean;
}

export async function cacheGet<T = unknown>(key: string, opts: CacheGetOptions = {}): Promise<T | null> {
  const raw = await getRedis().get(key);
  if (raw === null) return null;
  if (opts.parseJson === false) return raw as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface CacheSetOptions {
  /** TTL in seconds; omit for no expiration */
  ttlSeconds?: number;
  /** store as raw string (no JSON encoding); default false */
  raw?: boolean;
  /** only set if key does not exist (NX) */
  ifNotExists?: boolean;
}

export async function cacheSet(key: string, value: unknown, opts: CacheSetOptions = {}): Promise<'OK' | null> {
  const payload = opts.raw ? String(value) : JSON.stringify(value);
  const r = getRedis();
  let res: unknown;
  if (opts.ttlSeconds !== undefined && opts.ifNotExists) {
    res = await r.set(key, payload, 'EX', opts.ttlSeconds, 'NX');
  } else if (opts.ttlSeconds !== undefined) {
    res = await r.set(key, payload, 'EX', opts.ttlSeconds);
  } else if (opts.ifNotExists) {
    res = await r.set(key, payload, 'NX');
  } else {
    res = await r.set(key, payload);
  }
  return (res as 'OK' | null) ?? null;
}

export async function cacheDel(...keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  return getRedis().del(...keys);
}

/** Atomic read-through — `loader()` runs only on cache miss. */
export async function cacheRemember<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await loader();
  await cacheSet(key, fresh, { ttlSeconds });
  return fresh;
}
