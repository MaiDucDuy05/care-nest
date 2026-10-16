import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MetricsModule, RequestMetricsMiddleware, CorrelationIdMiddleware } from '@carenest/nestjs-common';
import { ProxyModule } from './proxy/proxy.module.js';

@Module({
  imports: [MetricsModule, ProxyModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestMetricsMiddleware)
      .forRoutes('*');
  }
}
