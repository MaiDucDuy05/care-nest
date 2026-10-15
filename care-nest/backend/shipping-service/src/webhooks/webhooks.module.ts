import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { ShipmentsModule } from '../shipments/shipments.module.js';

@Module({
  imports: [ProvidersModule, ShipmentsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
