import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import type { PushSubscription } from '@carenest/database';

@Injectable()
export class PushSubscriptionsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return (await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
    })) as PushSubscription | null;
  }

  async upsert(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ): Promise<PushSubscription> {
    return (await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth, userAgent, lastUsedAt: new Date() },
      create: { userId, endpoint, p256dh, auth, userAgent },
    })) as PushSubscription;
  }

  async deleteByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return (await this.prisma.pushSubscription.delete({
      where: { endpoint },
    })) as PushSubscription | null;
  }

  async listForUser(userId: string): Promise<PushSubscription[]> {
    return (await this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })) as PushSubscription[];
  }
}
