import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type Alert, type AlertStatus, type AlertSeverity, type AlertType } from '@carenest/database';

@Injectable()
export class AlertsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async create(data: {
    deviceId: string;
    subjectId: string;
    type: AlertType;
    severity: AlertSeverity;
    occurredAt: Date;
    payload: any;
  }): Promise<Alert> {
    return (await this.prisma.alert.create({
      data: {
        deviceId: data.deviceId,
        subjectId: data.subjectId,
        type: data.type,
        severity: data.severity,
        occurredAt: data.occurredAt,
        payload: data.payload as any,
        status: 'OPEN',
      },
    })) as unknown as Alert;
  }

  async findById(id: string): Promise<any> {
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async listOpen(page = 1, pageSize = 50): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where: { status: 'OPEN' },
        orderBy: [{ severity: 'desc' }, { receivedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.alert.count({ where: { status: 'OPEN' } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  async listForSubject(subjectId: string, page = 1, pageSize = 20): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where: { subjectId },
        orderBy: { receivedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.alert.count({ where: { subjectId } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  async updateStatus(id: string, status: AlertStatus, notes?: string): Promise<any> {
    const data: any = { status };
    if (status === 'ACKNOWLEDGED') data.acknowledgedAt = new Date();
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    if (notes !== undefined) data.notes = notes;
    return this.prisma.alert.update({ where: { id }, data });
  }
}
