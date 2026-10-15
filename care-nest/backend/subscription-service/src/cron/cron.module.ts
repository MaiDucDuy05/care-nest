import { Module } from '@nestjs/common';
import { SubscriptionCronService } from './subscription-cron.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { PlansModule } from '../plans/plans.module.js';

@Module({
  imports: [SubscriptionsModule, PlansModule],
  providers: [SubscriptionCronService],
})
export class CronModule {}
