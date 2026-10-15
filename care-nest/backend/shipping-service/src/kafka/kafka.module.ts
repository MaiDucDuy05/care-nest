import { Module, Global } from '@nestjs/common';
import { ShippingEventPublisher } from './shipping-event.publisher.js';

@Global()
@Module({
  providers: [ShippingEventPublisher],
  exports: [ShippingEventPublisher],
})
export class KafkaModule {}
