import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getRedis } from '@carenest/shared-redis';
import { PayoutsService } from './payouts.service.js';
import { PayoutsRepository } from './payouts.repository.js';
import { Prisma } from '@carenest/database';

const ESCROW_HOLD_DAYS = 7;
const ESCROW_TTL_SECONDS = ESCROW_HOLD_DAYS * 24 * 60 * 60;

/**
 * Cron worker that runs every 5 minutes. Scans Redis for escrow
 * records that have been released (TTL expired) and credits the
 * seller's wallet.
 *
 * The flow:
 *   1. Scan Redis for keys matching `escrow:*` whose status is RELEASED
 *      and have a `releasedAt` older than 60 seconds (avoid double
 *      processing within the same release window).
 *   2. For each, look up the Order + Seller in Postgres.
 *   3. Call `payoutsService.creditOrderToWallet` (idempotent via lock).
 *
 * Bank transfer to seller is handled separately by `processPendingPayouts`
 * (also a cron, but hourly).
 */
@Injectable()
export class EscrowReleaseWorker {
  private readonly logger = new Logger(EscrowReleaseWorker.name);

  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly repository: PayoutsRepository
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async tick() {
    try {
      await this.runOnce();
    } catch (err: any) {
      this.logger.error({ err: err.message }, 'EscrowReleaseWorker tick failed');
    }
  }

  /**
   * Run the worker logic once. Exposed for tests.
   */
  async runOnce(): Promise<{ processed: number; skipped: number }> {
    const redis = getRedis();
    if (!redis) {
      this.logger.debug('Redis not available — skipping tick');
      return { processed: 0, skipped: 0 };
    }

    const orderIds: string[] = [];
    let cursor = '0';
    do {
      // SCAN to avoid blocking on KEYS
      const [next, keys] = await redis.scan(cursor, 'MATCH', 'escrow:*', 'COUNT', '100');
      cursor = next;
      for (const key of keys) {
        const raw = await redis.get(key);
        if (!raw) continue;
        let data: { amount: number; status: string; releasedAt?: string };
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }
        if (data.status !== 'RELEASED' || !data.releasedAt) continue;
        const orderId = key.replace(/^escrow:/, '');
        orderIds.push(orderId);
      }
    } while (cursor !== '0');

    if (orderIds.length === 0) return { processed: 0, skipped: 0 };

    const orders = await this.repository.findOrdersByIds(orderIds);
    let processed = 0;
    let skipped = 0;
    for (const order of orders) {
      // Skip if no seller has bank info
      if (!order.seller.bankName || !order.seller.bankAccount) {
        this.logger.warn({ orderId: order.id }, 'Seller missing bank info — skipping');
        skipped++;
        continue;
      }
      try {
        const result = await this.payoutsService.creditOrderToWallet({
          orderId: order.id,
          orderNumber: order.orderNumber,
          sellerId: order.sellerId,
          grossVnd: Number(order.total),
          commissionRate: Number(order.seller.commissionRate),
          bankName: order.seller.bankName,
          bankAccount: order.seller.bankAccount,
          bankAccountName: order.seller.bankAccountName ?? '',
        });
        if (result) processed++;
        else skipped++;
      } catch (err: any) {
        this.logger.error({ orderId: order.id, err: err.message }, 'creditOrderToWallet failed');
        skipped++;
      }
    }
    this.logger.log({ processed, skipped, total: orders.length }, 'EscrowReleaseWorker done');
    return { processed, skipped };
  }
}
