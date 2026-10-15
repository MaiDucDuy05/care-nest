import { Module, Global } from '@nestjs/common';
import { OrderEventPublisher } from './order-event.publisher.js';
import { AlertKafkaConsumer } from './alert.consumer.js';
import { AlertsModule } from '../alerts/alerts.module.js';

@Global()
@Module({
  imports: [AlertsModule],
  providers: [OrderEventPublisher, AlertKafkaConsumer],
  exports: [OrderEventPublisher, AlertKafkaConsumer],
})
export class KafkaModule {}
