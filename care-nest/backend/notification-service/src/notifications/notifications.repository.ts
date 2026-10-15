import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type Notification } from '@carenest/database';

@Injectable()
export class NotificationsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async create(data: {
    userId: string;
    channel: any;
    templateKey: string;
    payload: any;
    subject?: string;
    body: string;
  }): Promise<Notification> {
    return (await this.prisma.notification.create({
      data: {
        userId: data.userId,
        channel: data.channel,
        templateKey: data.templateKey,
        payload: data.payload,
        subject: data.subject,
        body: data.body,
        status: 'QUEUED',
      },
    })) as unknown as Notification;
  }

  async markSent(id: string, providerMessageId?: string): Promise<Notification> {
    return (await this.prisma.notification.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 } },
    })) as unknown as Notification;
  }

  async markFailed(id: string, code: string): Promise<Notification> {
    return (await this.prisma.notification.update({
      where: { id },
      data: { status: 'FAILED', failureCode: code, attempts: { increment: 1 } },
    })) as unknown as Notification;
  }

  async markRead(id: string): Promise<Notification> {
    return (await this.prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    })) as unknown as Notification;
  }

  async listForUser(userId: string, page = 1, pageSize = 20): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }
}
