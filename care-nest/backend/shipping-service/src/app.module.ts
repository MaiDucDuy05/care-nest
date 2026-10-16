import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { ProvidersModule } from './providers/providers.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

@Module({
  imports: [MetricsModule, ProvidersModule, ShipmentsModule, WebhooksModule, KafkaModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
