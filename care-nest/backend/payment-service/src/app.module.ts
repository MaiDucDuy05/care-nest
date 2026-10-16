import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { PaymentsModule } from './payments/payments.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { EscrowModule } from './escrow/escrow.module.js';
import { GatewaysModule } from './gateways/gateways.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { PayoutsModule } from './payouts/payouts.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MetricsModule,  // S18: /metrics endpoint + MetricsService
    HealthModule,   // S18: /healthz + /livez
    GatewaysModule,
    PaymentsModule,
    WebhooksModule,
    EscrowModule,
    KafkaModule,
    PayoutsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
