import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MfaModule } from './mfa/mfa.module.js';
import { AuditModule } from './audit/audit.module.js';

@Module({
  imports: [MetricsModule, HealthModule, AuthModule, UsersModule, MfaModule, AuditModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
