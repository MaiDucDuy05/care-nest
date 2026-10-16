import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhookEventService } from './webhook-event.service.js';
import { WebhookRateLimitGuard } from './webhook-rate-limit.guard.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [WebhooksController],
  providers: [WebhookEventService, WebhookRateLimitGuard],
  exports: [WebhookEventService],
})
export class WebhooksModule {}
