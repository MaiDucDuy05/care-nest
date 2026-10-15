import { Injectable, NotFoundException } from '@nestjs/common';
import {
  getPrismaClient,
  PrismaClient,
  SubscriptionStatus,
  type Prisma,
} from '@carenest/database';

@Injectable()
export class SubscriptionsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findById(id: string): Promise<any> {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  async findActiveByUserId(userId: string): Promise<any[]> {
    return this.prisma.subscription.findMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDueForRenewal(now: Date, lookaheadDays = 1): Promise<any[]> {
    return this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          gte: now,
          lte: new Date(now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  async findExpired(now: Date): Promise<any[]> {
    return this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { lt: now },
      },
    });
  }

  async create(data: {
    userId: string;
    planRecordId: string | null;
    plan: string;
    startedAt: Date;
    currentPeriodEnd: Date;
    metadata?: Prisma.InputJsonValue;
  }): Promise<any> {
    return this.prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planRecordId,
        plan: data.plan as any,
        startedAt: data.startedAt,
        currentPeriodEnd: data.currentPeriodEnd,
        metadata: data.metadata,
      },
    });
  }

  async update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<any> {
    try {
      return await this.prisma.subscription.update({ where: { id }, data });
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException(`Không tìm thấy subscription ${id}`);
      throw err;
    }
  }

  async insertReminderIfMissing(
    subscriptionId: string,
    reminderType: string,
    daysBefore: number,
    scheduledFor: Date,
  ): Promise<boolean> {
    // Idempotent: relies on UNIQUE (subscriptionId, reminderType) to dedup.
    // Returns true if a row was inserted, false if it already existed.
    try {
      await this.prisma.subscriptionReminder.create({
        data: { subscriptionId, reminderType, daysBefore, scheduledFor },
      });
      return true;
    } catch (err: any) {
      if (err.code === 'P2002') return false;
      throw err;
    }
  }

  async findDueReminders(now: Date): Promise<any[]> {
    return this.prisma.subscriptionReminder.findMany({
      where: { sentAt: null, scheduledFor: { lte: now } },
      include: { subscription: { include: { planRecord: true } } },
    });
  }

  async markReminderSent(id: string, channel: string): Promise<any> {
    return this.prisma.subscriptionReminder.update({
      where: { id },
      data: { sentAt: new Date(), channel },
    });
  }
}
