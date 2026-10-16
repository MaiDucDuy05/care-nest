import { Injectable, Logger } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';

export interface RecordWebhookEventInput {
  gateway: 'VNPAY' | 'MOMO' | 'COD' | string;
  gatewayEventId?: string | null;
  transactionRef?: string | null;
  signatureValid: boolean;
  responseCode?: string | null;
  processedAction?: string | null;
  payload: unknown;
}

/**
 * Audit log + dedup helper for payment gateway webhooks. Every
 * gateway hit (valid OR invalid signature) lands here. We rely on
 * the unique `(gateway, gateway_event_id)` index to drop duplicates
 * so a vendor that retries a webhook 10x only triggers a single
 * downstream effect.
 */
@Injectable()
export class WebhookEventService {
  private prisma: PrismaClient;
  private readonly logger = new Logger(WebhookEventService.name);

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Try to record a new event. Returns `false` if a duplicate
   * (gateway, gatewayEventId) was already processed — caller should
   * treat the duplicate as a no-op.
   */
  async recordOnce(input: RecordWebhookEventInput): Promise<{ recorded: boolean; existingId?: string }> {
    if (input.gatewayEventId) {
      const existing = await this.prisma.paymentWebhookEvent.findUnique({
        where: { gateway_gatewayEventId: { gateway: input.gateway, gatewayEventId: input.gatewayEventId } },
        select: { id: true },
      });
      if (existing) {
        this.logger.debug(
          { gateway: input.gateway, gatewayEventId: input.gatewayEventId, existingId: existing.id },
          'Duplicate webhook event — skipping'
        );
        return { recorded: false, existingId: existing.id };
      }
    }
    try {
      const row = await this.prisma.paymentWebhookEvent.create({
        data: {
          gateway: input.gateway,
          gatewayEventId: input.gatewayEventId ?? null,
          transactionRef: input.transactionRef ?? null,
          signatureValid: input.signatureValid,
          responseCode: input.responseCode ?? null,
          processedAction: input.processedAction ?? null,
          payload: input.payload as any,
        },
      });
      return { recorded: true, existingId: row.id };
    } catch (err: any) {
      // Race: another request inserted the same (gateway, event_id)
      // between our findUnique and create. Treat as duplicate.
      if (err?.code === 'P2002') {
        return { recorded: false };
      }
      throw err;
    }
  }
}
