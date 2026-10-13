import { describe, it, expect } from 'vitest';
import {
  loadBaseEnv,
  loadDatabaseEnv,
  loadKafkaEnv,
  loadRedisEnv,
  loadIotEnv,
} from '../src/index.js';

describe('loadBaseEnv', () => {
  it('applies defaults', () => {
    const env = loadBaseEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.PORT).toBe(3000);
  });
  it('parses provided values', () => {
    const env = loadBaseEnv({
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      PORT: '8080',
    });
    expect(env.NODE_ENV).toBe('production');
    expect(env.LOG_LEVEL).toBe('warn');
    expect(env.PORT).toBe(8080);
  });
  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadBaseEnv({ NODE_ENV: 'staging' })).toThrow();
  });
});

describe('loadDatabaseEnv', () => {
  it('requires DATABASE_URL', () => {
    expect(() => loadDatabaseEnv({})).toThrow();
  });
  it('parses DATABASE_URL and pool sizes', () => {
    const env = loadDatabaseEnv({
      DATABASE_URL: 'postgres://localhost:5432/db',
      DATABASE_POOL_MIN: '5',
      DATABASE_POOL_MAX: '20',
    });
    expect(env.DATABASE_POOL_MIN).toBe(5);
    expect(env.DATABASE_POOL_MAX).toBe(20);
  });
});

describe('loadKafkaEnv', () => {
  it('requires KAFKA_BROKERS', () => {
    expect(() => loadKafkaEnv({})).toThrow();
  });
  it('parses brokers and SSL flag', () => {
    const env = loadKafkaEnv({
      KAFKA_BROKERS: 'k1:9092,k2:9092',
      KAFKA_SSL: 'true',
    });
    expect(env.KAFKA_BROKERS).toBe('k1:9092,k2:9092');
    expect(env.KAFKA_SSL).toBe(true);
  });
});

describe('loadRedisEnv', () => {
  it('requires REDIS_URL', () => {
    expect(() => loadRedisEnv({})).toThrow();
  });
  it('parses REDIS_URL and TLS flag', () => {
    const env = loadRedisEnv({ REDIS_URL: 'redis://localhost:6379', REDIS_TLS: '1' });
    expect(env.REDIS_TLS).toBe(true);
  });
});

describe('loadIotEnv', () => {
  it('applies IoT defaults', () => {
    const env = loadIotEnv({});
    expect(env.IOT_GATEWAY_PORT).toBe(18800);
    expect(env.IOT_GATEWAY_HOST).toBe('0.0.0.0');
    expect(env.IOT_MAX_BUFFER_SIZE).toBe(4096);
  });
});
