import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { PushSubscriptionsModule } from './push-subscriptions/push-subscriptions.module.js';

@Module({
  imports: [NotificationsModule, KafkaModule, PreferencesModule, PushSubscriptionsModule],
})
export class AppModule {}
