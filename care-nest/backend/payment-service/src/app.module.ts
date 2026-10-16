import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsModule } from './payments/payments.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { EscrowModule } from './escrow/escrow.module.js';
import { GatewaysModule } from './gateways/gateways.module.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { PayoutsModule } from './payouts/payouts.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    GatewaysModule,
    PaymentsModule,
    WebhooksModule,
    EscrowModule,
    KafkaModule,
    PayoutsModule,
  ],
})
export class AppModule {}
