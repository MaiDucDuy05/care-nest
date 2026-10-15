import { Module, Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from './prisma.service.js';
import { getRedis } from '@carenest/shared-redis';

/**
 * Health endpoints used by k8s probes and load balancers.
 *
 * - GET /healthz   — full check (DB + Redis). Used for k8s readinessProbe.
 * - GET /livez     — liveness only. Always returns OK if the event loop is alive.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('healthz')
  @HealthCheck()
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        const ok = await this.prisma.isHealthy();
        return { database: { status: ok ? 'up' : 'down' } };
      },
      async (): Promise<HealthIndicatorResult> => {
        try {
          const r = getRedis();
          const pong = await r.ping();
          return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
        } catch (e) {
          return { redis: { status: 'down', message: (e as Error).message } };
        }
      },
    ]);
  }

  @Get('livez')
  live() {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
