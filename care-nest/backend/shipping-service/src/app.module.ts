import { Module } from '@nestjs/common';
import { ProvidersModule } from './providers/providers.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

@Module({
  imports: [ProvidersModule, ShipmentsModule, WebhooksModule, KafkaModule],
})
export class AppModule {}
