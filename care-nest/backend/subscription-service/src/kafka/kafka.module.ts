import { Module, Global } from '@nestjs/common';
import { SubscriptionEventPublisher } from './subscription-event.publisher.js';

@Global()
@Module({
  providers: [SubscriptionEventPublisher],
  exports: [SubscriptionEventPublisher],
})
export class KafkaModule {}
