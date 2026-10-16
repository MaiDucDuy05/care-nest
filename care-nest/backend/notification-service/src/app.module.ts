import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { NotificationsModule } from './notifications/notifications.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { PushSubscriptionsModule } from './push-subscriptions/push-subscriptions.module.js';

@Module({
  imports: [MetricsModule, HealthModule, NotificationsModule, KafkaModule, PreferencesModule, PushSubscriptionsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
