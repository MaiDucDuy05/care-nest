import { Injectable, Logger } from '@nestjs/common';
import { getPrismaClient, PrismaClient, AuditAction, AuditActorType } from '@carenest/database';

export interface AuditEvent {
  actorId?: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: any;
  after?: any;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Append-only audit log writer. We never block the calling request
 * on the audit insert — if the DB is slow we log a warning rather
 * than failing the user action. Phase 2 may move this to async queue.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: event.actorId ?? null,
          actorType: event.actorType,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId ?? null,
          before: event.before ?? undefined,
          after: event.after ?? undefined,
          ip: event.ip ?? null,
          userAgent: event.userAgent ?? null,
          requestId: event.requestId ?? null,
        },
      });
    } catch (err: any) {
      // Audit failure must never break the calling request
      this.logger.warn({ err: err.message, entityType: event.entityType, entityId: event.entityId }, 'Audit log write failed');
    }
  }

  /**
   * Helper for finding audit trails by entity.
   */
  async listFor(entityType: string, entityId: string, page = 1, pageSize = 50): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where: { entityType, entityId } }),
    ]);
    return { items, total, page, pageSize };
  }
}
