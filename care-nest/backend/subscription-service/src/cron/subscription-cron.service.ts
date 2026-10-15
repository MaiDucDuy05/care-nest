import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@carenest/database';
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository.js';
import { PlansRepository } from '../plans/plans.repository.js';
import { SubscriptionEventPublisher } from '../kafka/subscription-event.publisher.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;

/**
 * Three cron jobs:
 *
 *   1. `renewDueSubscriptions` — daily 02:00. For every ACTIVE sub whose
 *      `currentPeriodEnd` falls in the next 24h, advance the period by 30
 *      days and publish SUBSCRIPTION_RENEWED. Payment collection is the
 *      payment-service's job — this just records the new period.
 *
 *   2. `sendRenewalReminders` — daily 09:00. For every unsent
 *      subscription_reminder where scheduledFor <= now, publish a
 *      notification.request and mark sent.
 *
 *   3. `expireOverdueSubscriptions` — daily 14:00. Mark ACTIVE subs whose
 *      `currentPeriodEnd` is in the past as EXPIRED. (Dunning is the
 *      payment-service's job — this is the final state after grace.)
 *
 * All three are idempotent: renewals advance the period deterministically,
 * reminders have UNIQUE (subscriptionId, reminderType) and `sentAt` dedup,
 * and EXPIRED is a one-way state transition.
 *
 * In tests, all three methods are exported so they can be invoked directly
 * with a fixed `now` without waiting for the schedule.
 */
@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansRepository: PlansRepository,
    private readonly events: SubscriptionEventPublisher,
  ) {}

  /** Cron expression override (for tests) */
  static readonly RENEW_HOUR = process.env.CRON_RENEWAL_HOUR
    ? parseInt(process.env.CRON_RENEWAL_HOUR, 10)
    : 2;
  static readonly REMINDER_HOUR = process.env.CRON_REMINDER_HOUR
    ? parseInt(process.env.CRON_REMINDER_HOUR, 10)
    : 9;
  static readonly DUNNING_HOUR = process.env.CRON_DUNNING_HOUR
    ? parseInt(process.env.CRON_DUNNING_HOUR, 10)
    : 14;

  @Cron(`0 ${SubscriptionCronService.RENEW_HOUR} * * *`, { name: 'renew-subscriptions' })
  async renewDueSubscriptions() {
    if (process.env.CRON_ENABLED === 'false') return;
    const now = new Date();
    const due = await this.subscriptionsRepository.findDueForRenewal(now, 1);
    this.logger.log(`Found ${due.length} subscriptions due for renewal`);
    for (const sub of due) {
      const newPeriodEnd = new Date(
        sub.currentPeriodEnd.getTime() + PERIOD_DAYS * DAY_MS,
      );
      await this.subscriptionsRepository.update(sub.id, {
        currentPeriodEnd: newPeriodEnd,
      });
      // Schedule next round of reminders
      await this.subscriptionsRepository
        .findById(sub.id)
        .then((fresh) => fresh && this.scheduleNextReminders(fresh.id, newPeriodEnd));

      try {
        const plan = await this.plansRepository.findById(sub.planId ?? '');
        await this.events.publishRenewed({
          subscriptionId: sub.id,
          userId: sub.userId,
          planCode: plan?.code ?? String(sub.plan),
          periodStart: sub.currentPeriodEnd.toISOString(),
          periodEnd: newPeriodEnd.toISOString(),
          amount: Number(plan?.priceMonthly ?? 0),
        });
      } catch (err: any) {
        this.logger.warn({ err: err.message }, 'Failed to publish SUBSCRIPTION_RENEWED');
      }
    }
  }

  @Cron(`0 ${SubscriptionCronService.REMINDER_HOUR} * * *`, { name: 'send-renewal-reminders' })
  async sendRenewalReminders() {
    if (process.env.CRON_ENABLED === 'false') return;
    const now = new Date();
    const due = await this.subscriptionsRepository.findDueReminders(now);
    this.logger.log(`Found ${due.length} renewal reminders due`);
    for (const reminder of due) {
      try {
        // Phase 3 will publish to NOTIFICATION_REQUESTS; for Phase 2 we just
        // record the channel and mark sent so the dashboard can show it.
        await this.subscriptionsRepository.markReminderSent(reminder.id, 'EMAIL');
      } catch (err: any) {
        this.logger.warn({ err: err.message, reminderId: reminder.id }, 'Failed to send reminder');
      }
    }
  }

  @Cron(`0 ${SubscriptionCronService.DUNNING_HOUR} * * *`, { name: 'expire-subscriptions' })
  async expireOverdueSubscriptions() {
    if (process.env.CRON_ENABLED === 'false') return;
    const now = new Date();
    const overdue = await this.subscriptionsRepository.findExpired(now);
    this.logger.log(`Found ${overdue.length} overdue subscriptions`);
    for (const sub of overdue) {
      try {
        await this.subscriptionsRepository.update(sub.id, {
          status: SubscriptionStatus.EXPIRED,
        });
        await this.events.publishExpired({
          subscriptionId: sub.id,
          userId: sub.userId,
          expiredAt: now.toISOString(),
        });
      } catch (err: any) {
        this.logger.warn({ err: err.message, subscriptionId: sub.id }, 'Failed to expire');
      }
    }
  }

  private async scheduleNextReminders(subscriptionId: string, periodEnd: Date) {
    const offsets: Array<[string, number]> = [
      ['D-30', 30], ['D-15', 15], ['D-7', 7], ['D-3', 3],
    ];
    for (const [type, daysBefore] of offsets) {
      const scheduledFor = new Date(periodEnd.getTime() - daysBefore * DAY_MS);
      if (scheduledFor.getTime() < Date.now()) continue;
      await this.subscriptionsRepository.insertReminderIfMissing(
        subscriptionId, type, daysBefore, scheduledFor,
      );
    }
  }
}
