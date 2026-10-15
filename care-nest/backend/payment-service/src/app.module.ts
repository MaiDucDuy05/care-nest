import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { EscrowModule } from './escrow/escrow.module.js';
import { GatewaysModule } from './gateways/gateways.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

@Module({
  imports: [GatewaysModule, PaymentsModule, WebhooksModule, EscrowModule, KafkaModule],
})
export class AppModule {}
