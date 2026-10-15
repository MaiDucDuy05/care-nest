import { Module } from '@nestjs/common';
import { PushSubscriptionsController } from './push-subscriptions.controller.js';
import { PushSubscriptionsService } from './push-subscriptions.service.js';
import { PushSubscriptionsRepository } from './push-subscriptions.repository.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [PushSubscriptionsController],
  providers: [PushSubscriptionsService, PushSubscriptionsRepository, JwtAuthGuard],
  exports: [PushSubscriptionsService],
})
export class PushSubscriptionsModule {}
