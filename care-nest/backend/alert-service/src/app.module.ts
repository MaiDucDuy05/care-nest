import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { AlertsModule } from './alerts/alerts.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [MetricsModule, AlertsModule, KafkaModule, RealtimeModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
