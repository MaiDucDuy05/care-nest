import { Module, Global } from '@nestjs/common';
import { NotificationKafkaConsumer } from './notification.consumer.js';
import { NotificationEventPublisher } from './notification-event.publisher.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Global()
@Module({
  imports: [NotificationsModule],
  providers: [NotificationKafkaConsumer, NotificationEventPublisher],
  exports: [NotificationKafkaConsumer, NotificationEventPublisher],
})
export class KafkaModule {}
