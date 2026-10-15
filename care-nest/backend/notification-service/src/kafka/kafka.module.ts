import { Module, Global } from '@nestjs/common';
import { NotificationKafkaConsumer } from './notification.consumer.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Global()
@Module({
  imports: [NotificationsModule],
  providers: [NotificationKafkaConsumer],
  exports: [NotificationKafkaConsumer],
})
export class KafkaModule {}
