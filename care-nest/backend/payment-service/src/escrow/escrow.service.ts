import { Injectable, Logger } from '@nestjs/common';
import { withLock } from '@carenest/shared-redis';

const ESCROW_HOLD_DAYS = 7;

/**
 * Escrow holds the payment for N days after delivery to protect the buyer.
 * Once the hold window elapses without a refund claim, the funds are
 * released to the seller's pending payout.
 *
 * Phase 1 implementation: scheduled via in-memory TTL key in Redis. A
 * background cron (Phase 2) will move released funds to the seller
 * ledger. This module is responsible only for the hold/release contract.
 */
@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  async hold(orderId: string, amount: number): Promise<void> {
    const key = `escrow:${orderId}`;
    try {
      await withLock(key, async () => {
        // Record hold in Redis with TTL = 7 days
        const { getRedis } = await import('@carenest/shared-redis');
        await getRedis().set(
          key,
          JSON.stringify({ amount, status: 'HELD', heldAt: new Date().toISOString() }),
          'EX',
          ESCROW_HOLD_DAYS * 24 * 60 * 60,
        );
        this.logger.log({ orderId, amount, ttlDays: ESCROW_HOLD_DAYS }, 'Escrow held');
      }, { ttlMs: 5_000 });
    } catch (err: any) {
      this.logger.warn({ err: err.message, orderId }, 'Escrow hold failed (Redis unavailable?) — continuing');
    }
  }

  async release(orderId: string): Promise<boolean> {
    const { getRedis } = await import('@carenest/shared-redis');
    const key = `escrow:${orderId}`;
    const raw = await getRedis().get(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    data.status = 'RELEASED';
    data.releasedAt = new Date().toISOString();
    // Keep the record for audit, but mark as released (no TTL).
    await getRedis().set(key, JSON.stringify(data));
    this.logger.log({ orderId }, 'Escrow released');
    return true;
  }

  async refund(orderId: string): Promise<boolean> {
    const { getRedis } = await import('@carenest/shared-redis');
    const key = `escrow:${orderId}`;
    const raw = await getRedis().get(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    data.status = 'REFUNDED';
    data.refundedAt = new Date().toISOString();
    await getRedis().set(key, JSON.stringify(data));
    this.logger.log({ orderId }, 'Escrow refunded');
    return true;
  }
}
