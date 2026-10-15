import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

@Module({
  imports: [NotificationsModule, KafkaModule],
})
export class AppModule {}
