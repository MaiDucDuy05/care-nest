/**
 * Environment configuration loaders — fail fast on missing or invalid values.
 *
 * Each service calls one of these at boot. We never read `process.env`
 * directly outside of this module so that all env access is auditable and
 * validated.
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  SERVICE_NAME: z.string().min(1).default('care-nest-service'),
});

export type BaseEnv = z.infer<typeof envSchema>;

export function loadBaseEnv(source: NodeJS.ProcessEnv = process.env): BaseEnv {
  return envSchema.parse(source);
}

const databaseEnvSchema = envSchema.extend({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
});
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function loadDatabaseEnv(source: NodeJS.ProcessEnv = process.env): DatabaseEnv {
  return databaseEnvSchema.parse(source);
}

const kafkaEnvSchema = envSchema.extend({
  KAFKA_BROKERS: z.string().min(1), // comma-separated host:port list
  KAFKA_CLIENT_ID: z.string().min(1).default('care-nest'),
  KAFKA_SSL: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});
export type KafkaEnv = z.infer<typeof kafkaEnvSchema>;

export function loadKafkaEnv(source: NodeJS.ProcessEnv = process.env): KafkaEnv {
  return kafkaEnvSchema.parse(source);
}

const redisEnvSchema = envSchema.extend({
  REDIS_URL: z.string().url(),
  REDIS_TLS: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});
export type RedisEnv = z.infer<typeof redisEnvSchema>;

export function loadRedisEnv(source: NodeJS.ProcessEnv = process.env): RedisEnv {
  return redisEnvSchema.parse(source);
}

const iotEnvSchema = envSchema.extend({
  IOT_GATEWAY_PORT: z.coerce.number().int().min(1).max(65535).default(18800),
  IOT_GATEWAY_HOST: z.string().default('0.0.0.0'),
  IOT_MAX_BUFFER_SIZE: z.coerce.number().int().min(1024).default(4096),
});
export type IotEnv = z.infer<typeof iotEnvSchema>;

export function loadIotEnv(source: NodeJS.ProcessEnv = process.env): IotEnv {
  return iotEnvSchema.parse(source);
}
