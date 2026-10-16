import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { PlansModule } from './plans/plans.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { ProrationModule } from './proration/proration.module.js';
import { ActivationModule } from './activation/activation.module.js';
import { CronModule } from './cron/cron.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MetricsModule,
    KafkaModule,
    ProrationModule,
    PlansModule,
    SubscriptionsModule,
    ActivationModule,
    CronModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
