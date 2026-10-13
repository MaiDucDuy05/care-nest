/**
 * Structured logger (pino)
 *
 * Use a single logger per service and bind it to a request context
 * (requestId, userId) via `logger.child({...})`.
 */

import { pino, type Logger, type LoggerOptions } from 'pino';
import { loadBaseEnv, SERVICE_NAMES, type ServiceName } from '@carenest/shared-config';

export interface CreateLoggerOptions {
  service: ServiceName | string;
  level?: LoggerOptions['level'];
  /** Pretty print in development (do NOT enable in production) */
  pretty?: boolean;
  /** Extra base fields merged into every log entry */
  base?: Record<string, unknown>;
}

/**
 * Create a logger for a service.
 *
 * In production, logs are emitted as NDJSON to stdout. In development, set
 * `pretty: true` to get human-readable output via `pino-pretty`.
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const env = loadBaseEnv();
  const isProd = env.NODE_ENV === 'production';
  const level = options.level ?? env.LOG_LEVEL;

  const loggerOptions: LoggerOptions = {
    name: options.service,
    level,
    base: {
      env: env.NODE_ENV,
      service: options.service,
      ...options.base,
    },
    // Reasonable defaults for a microservice
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  if (options.pretty ?? (!isProd && process.stdout.isTTY)) {
    return pino({
      ...loggerOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
        },
      },
    });
  }
  return pino(loggerOptions);
}

export { SERVICE_NAMES };
