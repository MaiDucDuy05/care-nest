import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhookEventService } from './webhook-event.service.js';
import { WebhookRateLimitGuard } from './webhook-rate-limit.guard.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { GatewaysModule } from '../gateways/gateways.module.js';

@Module({
  imports: [PaymentsModule, GatewaysModule],
  controllers: [WebhooksController],
  providers: [WebhookEventService, WebhookRateLimitGuard],
  exports: [WebhookEventService],
})
export class WebhooksModule {}
