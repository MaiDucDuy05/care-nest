import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  SubscriptionStatus,
  type Prisma,
} from '@carenest/database';
import { PlansRepository } from '../plans/plans.repository.js';
import { SubscriptionsRepository } from './subscriptions.repository.js';
import { SubscriptionEventPublisher } from '../kafka/subscription-event.publisher.js';
import { calculateProration } from '../proration/proration.js';
import type {
  CreateSubscriptionDto,
  ChangePlanDto,
  CancelSubscriptionDto,
} from './dto/subscriptions.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansRepository: PlansRepository,
    private readonly events: SubscriptionEventPublisher,
  ) {}

  /**
   * Start a new subscription for a user. The plan's `priceMonthly` and
   * `features` are snapshotted via the `planId` FK so future plan edits
   * don't rewrite history.
   */
  async create(userId: string, dto: CreateSubscriptionDto) {
    const plan = await this.plansRepository.findByCode(dto.planCode);
    if (!plan) throw new NotFoundException(`Không tìm thấy plan "${dto.planCode}"`);
    if (!plan.active) throw new BadRequestException(`Plan "${dto.planCode}" đã ngừng bán`);

    // Refuse if user already has an active subscription for a paid plan
    const active = await this.subscriptionsRepository.findActiveByUserId(userId);
    if (active.length > 0) {
      throw new ConflictException('User đã có subscription đang ACTIVE — hãy dùng change-plan');
    }

    const startAt = dto.startAt ?? new Date();
    const trialEnd = dto.trialDays > 0
      ? new Date(startAt.getTime() + dto.trialDays * DAY_MS)
      : startAt;
    const periodEnd = new Date(trialEnd.getTime() + PERIOD_DAYS * DAY_MS);

    const sub = await this.subscriptionsRepository.create({
      userId,
      planRecordId: plan.id,
      plan: dto.planCode,
      startedAt: startAt,
      currentPeriodEnd: periodEnd,
      metadata: dto.metadata as Prisma.InputJsonValue,
    });

    try {
      await this.events.publishCreated({
        subscriptionId: sub.id,
        userId,
        planCode: dto.planCode,
        startedAt: sub.startedAt.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish SUBSCRIPTION_CREATED');
    }

    return sub;
  }

  /**
   * Mid-cycle plan change with proration. The `currentPeriodEnd` is NOT
   * touched here — the new plan takes effect on `effectiveAt` and the
   * charge is computed and returned so the caller can collect payment
   * before applying the change.
   *
   * Returned shape:
   *  { subscription, newPlan, proration: { netCharge, ... } }
   */
  async changePlan(userId: string, subscriptionId: string, dto: ChangePlanDto) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException(`Không tìm thấy subscription ${subscriptionId}`);
    if (sub.userId !== userId) throw new NotFoundException('Subscription không thuộc user này');
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Chỉ đổi plan được khi subscription đang ACTIVE');
    }

    const newPlan = await this.plansRepository.findByCode(dto.newPlanCode);
    if (!newPlan) throw new NotFoundException(`Không tìm thấy plan "${dto.newPlanCode}"`);
    if (!newPlan.active) throw new BadRequestException(`Plan "${dto.newPlanCode}" đã ngừng bán`);

    const currentPlan = await this.plansRepository.findById(sub.planId ?? '');
    const currentPrice = Number(currentPlan?.priceMonthly ?? 0);
    const newPrice = Number(newPlan.priceMonthly);

    if (currentPrice === newPrice) {
      throw new BadRequestException('Plan mới giống plan hiện tại');
    }

    const effectiveAt = dto.effectiveAt ?? new Date();
    const proration = calculateProration({
      currentPriceMonthly: currentPrice,
      newPriceMonthly: newPrice,
      effectiveAt,
      currentPeriodStart: sub.startedAt,
      currentPeriodEnd: sub.currentPeriodEnd,
    });

    // Only the FK + legacy enum flip now; the period is preserved and the
    // new price is applied at next renewal. Caller is expected to collect
    // `proration.netCharge` via payment-service before calling applyChangePlan.
    return { subscription: sub, newPlan, proration };
  }

  /**
   * Apply a previously-priced plan change. Called by the caller AFTER
   * payment has been collected (or downgrade credit has been issued).
   */
  async applyChangePlan(subscriptionId: string, newPlanId: string, newPlanCode: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException(`Không tìm thấy subscription ${subscriptionId}`);

    return this.subscriptionsRepository.update(subscriptionId, {
      planRecord: { connect: { id: newPlanId } },
      plan: newPlanCode as any,
    });
  }

  async cancel(userId: string, subscriptionId: string, dto: CancelSubscriptionDto) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException(`Không tìm thấy subscription ${subscriptionId}`);
    if (sub.userId !== userId) throw new NotFoundException('Subscription không thuộc user này');
    if (sub.status === SubscriptionStatus.CANCELLED) return sub;
    if (sub.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException('Subscription đã EXPIRED — không cancel được');
    }

    const now = new Date();
    const data: Prisma.SubscriptionUpdateInput = {
      cancelledAt: now,
      status: dto.immediate
        ? SubscriptionStatus.CANCELLED
        : SubscriptionStatus.CANCELLED,
    };
    if (dto.immediate) {
      data.currentPeriodEnd = now;
    }

    const updated = await this.subscriptionsRepository.update(subscriptionId, data);

    try {
      await this.events.publishCancelled({
        subscriptionId,
        userId,
        cancelledAt: now.toISOString(),
        reason: dto.reason,
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish SUBSCRIPTION_CANCELLED');
    }
    return updated;
  }

  async listForAdmin(page: number, limit: number, status?: SubscriptionStatus) {
    const [result, plans] = await Promise.all([
      this.subscriptionsRepository.listForAdmin(page, limit, status),
      this.plansRepository.findAll(),
    ]);
    const prices = this.planPrices(plans);
    return {
      data: result.items.map((subscription) => this.toAdminRow(subscription, prices)),
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit) || 1,
      statusCounts: result.statusCounts,
    };
  }

  async getForAdmin(id: string) {
    const [subscription, plans] = await Promise.all([
      this.subscriptionsRepository.findForAdmin(id),
      this.plansRepository.findAll(),
    ]);
    if (!subscription) throw new NotFoundException(`KhÃ´ng tÃ¬m tháº¥y subscription ${id}`);
    return {
      ...this.toAdminRow(subscription, this.planPrices(plans)),
      reminders: subscription.reminders.map((reminder: { id: string; reminderType: string; scheduledFor: Date }) => ({
        id: reminder.id,
        kind: reminder.reminderType,
        triggerAt: reminder.scheduledFor.toISOString(),
      })),
    };
  }

  async getAdminMrr(now = new Date()) {
    const [subscriptions, plans] = await Promise.all([
      this.subscriptionsRepository.findAllForAnalytics(),
      this.plansRepository.findAll(),
    ]);
    const prices = this.planPrices(plans);
    const monthStarts = this.lastSixMonthStarts(now);
    const history = monthStarts.map((monthStart) => {
      const nextMonth = this.nextMonthStart(monthStart);
      const asOf = nextMonth.getTime() > now.getTime() ? now : new Date(nextMonth.getTime() - 1);
      return {
        month: this.monthLabel(monthStart),
        mrr: this.mrrAt(subscriptions, prices, asOf, asOf.getTime() === now.getTime()),
      };
    });
    const current = this.mrrAt(subscriptions, prices, now, true);
    const previous = history.length > 1 ? history[history.length - 2].mrr : 0;
    const trend = previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
    return { current, previous, trend, history };
  }

  async getAdminChurn(now = new Date()) {
    const subscriptions = await this.subscriptionsRepository.findAllForAnalytics();
    const history = this.lastSixMonthStarts(now).map((monthStart) => {
      const nextMonth = this.nextMonthStart(monthStart);
      const activeAtStart = subscriptions.filter((subscription) =>
        this.wasActiveAt(subscription, monthStart),
      ).length;
      const cancelledInMonth = subscriptions.filter((subscription) =>
        subscription.cancelledAt &&
        subscription.cancelledAt.getTime() >= monthStart.getTime() &&
        subscription.cancelledAt.getTime() < nextMonth.getTime(),
      ).length;
      return {
        month: this.monthLabel(monthStart),
        rate: activeAtStart === 0 ? 0 : (cancelledInMonth / activeAtStart) * 100,
      };
    });
    const current = history[history.length - 1]?.rate ?? 0;
    const previous = history[history.length - 2]?.rate ?? 0;
    return { current, previous, trend: current - previous, history };
  }

  async getAdminPlanDistribution() {
    const [subscriptions, plans] = await Promise.all([
      this.subscriptionsRepository.findAllForAnalytics(),
      this.plansRepository.findAll(),
    ]);
    const prices = this.planPrices(plans);
    const grouped = new Map<string, { planId: string; planName: string; count: number; revenueVnd: number }>();

    for (const subscription of subscriptions) {
      if (subscription.status !== SubscriptionStatus.ACTIVE) continue;
      const row = this.toAdminRow(subscription, prices);
      const key = row.planId;
      const current = grouped.get(key) ?? {
        planId: key,
        planName: row.planName,
        count: 0,
        revenueVnd: 0,
      };
      current.count += 1;
      current.revenueVnd += row.priceVnd;
      grouped.set(key, current);
    }

    return { distribution: [...grouped.values()] };
  }

  async getMySubscriptions(userId: string) {
    return this.subscriptionsRepository.findActiveByUserId(userId);
  }

  async getById(id: string) {
    const sub = await this.subscriptionsRepository.findById(id);
    if (!sub) throw new NotFoundException(`Không tìm thấy subscription ${id}`);
    return sub;
  }

  /**
   * Idempotently schedule the standard 30/15/7/3-day renewal reminders.
   * Safe to call multiple times — the UNIQUE (subscriptionId, reminderType)
   * constraint on `subscription_reminders` dedups.
   */
  async scheduleRenewalReminders(subscriptionId: string, periodEnd: Date) {
    const offsets: Array<[string, number]> = [
      ['D-30', 30],
      ['D-15', 15],
      ['D-7', 7],
      ['D-3', 3],
    ];
    for (const [type, daysBefore] of offsets) {
      const scheduledFor = new Date(periodEnd.getTime() - daysBefore * DAY_MS);
      // Don't schedule reminders in the past — they'd be sent on the next tick
      if (scheduledFor.getTime() < Date.now()) continue;
      await this.subscriptionsRepository.insertReminderIfMissing(
        subscriptionId,
        type,
        daysBefore,
        scheduledFor,
      );
    }
  }

  private planPrices(plans: any[]): Map<string, number> {
    return new Map(plans.map((plan) => [String(plan.code).toUpperCase(), Number(plan.priceMonthly)]));
  }

  private toAdminRow(subscription: any, prices: Map<string, number>) {
    const planCode = String(subscription.plan);
    const fallbackName = planCode.charAt(0) + planCode.slice(1).toLowerCase();
    return {
      id: subscription.id,
      userId: subscription.userId ?? subscription.seller?.userId ?? '',
      userName:
        subscription.user?.fullName ??
        subscription.seller?.storeName ??
        subscription.seller?.user?.fullName ??
        '—',
      userEmail: subscription.user?.email ?? subscription.seller?.user?.email ?? '',
      planId: subscription.planId ?? subscription.planRecord?.id ?? planCode,
      planName: subscription.planRecord?.name ?? fallbackName,
      interval: 'MONTHLY',
      status: subscription.status,
      priceVnd: Number(subscription.planRecord?.priceMonthly ?? prices.get(planCode.toUpperCase()) ?? 0),
      currentPeriodStart: subscription.startedAt.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelledAt: subscription.cancelledAt?.toISOString(),
    };
  }

  private mrrAt(subscriptions: any[], prices: Map<string, number>, at: Date, currentOnly: boolean): number {
    return subscriptions.reduce((total, subscription) => {
      if (currentOnly) {
        if (subscription.status !== SubscriptionStatus.ACTIVE || subscription.cancelledAt) return total;
      } else if (subscription.status === SubscriptionStatus.TRIALING) {
        return total;
      }

      const hasStarted = subscription.startedAt.getTime() <= at.getTime();
      const periodHasNotEnded = subscription.currentPeriodEnd.getTime() > at.getTime();
      const wasNotCancelled = !subscription.cancelledAt || subscription.cancelledAt.getTime() > at.getTime();
      if (!hasStarted || !periodHasNotEnded || !wasNotCancelled) return total;

      const planCode = String(subscription.plan).toUpperCase();
      return total + Number(subscription.planRecord?.priceMonthly ?? prices.get(planCode) ?? 0);
    }, 0);
  }

  private wasActiveAt(subscription: any, at: Date): boolean {
    if (subscription.status === SubscriptionStatus.TRIALING) return false;
    return (
      subscription.startedAt.getTime() <= at.getTime() &&
      subscription.currentPeriodEnd.getTime() > at.getTime() &&
      (!subscription.cancelledAt || subscription.cancelledAt.getTime() > at.getTime())
    );
  }

  private lastSixMonthStarts(now: Date): Date[] {
    return Array.from({ length: 6 }, (_, index) =>
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1)),
    );
  }

  private nextMonthStart(monthStart: Date): Date {
    return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  }

  private monthLabel(monthStart: Date): string {
    return `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}
