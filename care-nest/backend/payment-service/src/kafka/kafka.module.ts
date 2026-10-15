import { Module, Global } from '@nestjs/common';
import { OrderEventPublisher } from './order-event.publisher.js';

@Global()
@Module({
  providers: [OrderEventPublisher],
  exports: [OrderEventPublisher],
})
export class KafkaModule {}
