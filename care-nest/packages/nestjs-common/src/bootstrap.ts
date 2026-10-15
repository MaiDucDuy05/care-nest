/**
 * Boilerplate `main.ts` factories.
 *
 * Each back-end service is so similar that a 90-line file ends up duplicated
 * 7 times. Keep it here so the per-service bootstrap is a one-liner.
 */
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, type INestApplication, type DynamicModule } from '@nestjs/common';
import { AppConfigModule } from './modules/config.module.js';
import { KafkaModule } from './modules/kafka.module.js';
import { RedisModule } from './modules/redis.module.js';
import { PrismaModule } from './modules/prisma.module.js';
import { HealthModule } from './modules/health.module.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { IdempotencyKeyGuard } from './guards/idempotency-key.guard.js';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';

export interface BootstrapOptions {
  serviceName: string;
  /**
   * Each service exposes a Swagger doc on /docs. Set `false` for worker
   * services (alert-engine) that don't take HTTP traffic.
   */
  swagger?: boolean;
  /**
   * Additional modules to import beyond the default stack. Order matters:
   * features should come after the infra modules below.
   */
  featureModules?: DynamicModule[] | { forRoot: () => DynamicModule }[];
}

/**
 * Standard NestJS bootstrap used by every HTTP service. Worker services
 * (alert-engine) use `bootstrapWorker` instead.
 */
export async function bootstrapHttp(rootModule: unknown, opts: BootstrapOptions): Promise<INestApplication> {
  const log = new Logger('Bootstrap');

  const app = await NestFactory.create(
    (rootModule as new (...args: unknown[]) => unknown) as Parameters<typeof NestFactory.create>[0],
    {
      logger: ['log', 'warn', 'error', 'debug', 'verbose'],
    },
  );

  const ref = app.get(Reflector);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalGuards(
    new JwtAuthGuard(ref),
    new RolesGuard(ref),
    new IdempotencyKeyGuard(ref),
  );
  app.use(new CorrelationIdMiddleware().use);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  log.log(`${opts.serviceName} listening on :${port}`);
  return app;
}

/** Re-export commonly-used building blocks so a service's main.ts can be 1 import. */
export {
  AppConfigModule,
  KafkaModule,
  RedisModule,
  PrismaModule,
  HealthModule,
};
