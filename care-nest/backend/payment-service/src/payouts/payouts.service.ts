import { Injectable, Logger } from '@nestjs/common';
import { withLock } from '@carenest/shared-redis';
import { PayoutsRepository } from './payouts.repository.js';
import { PayoutEventPublisher } from './payout-event.publisher.js';

/**
 * S12: Payouts service.
 *
 * - `creditOrderToWallet`: called by the escrow-release worker when
 *   an order's hold expires. Computes commission, writes ledger
 *   entries, creates a PENDING Payout.
 * - `processPendingPayouts`: walks the Payout table, calls the bank
 *   transfer stub, marks the row PAID (or FAILED). The bank transfer
 *   is a stub today; Phase 3 wires a real partner.
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly repository: PayoutsRepository,
    private readonly eventPublisher: PayoutEventPublisher
  ) {}

  /**
   * Idempotent: wrapped in a Redis lock keyed by orderId so the
   * worker can call this from multiple instances safely.
   */
  async creditOrderToWallet(input: {
    orderId: string;
    orderNumber: string;
    sellerId: string;
    grossVnd: number;
    commissionRate: number;
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
  }): Promise<{ payoutId: string; netVnd: number } | null> {
    return withLock(
      `wallet-credit:order:${input.orderId}`,
      async () => {
        // Idempotency check: if a Payout already exists for this order,
        // skip. We use a WalletEntry lookup since Payout doesn't have
        // a unique constraint on orderId (orders can be split later).
        const prisma = (await import('@carenest/database')).getPrismaClient();
        const existing = await prisma.walletEntry.findFirst({
          where: { referenceType: 'order', referenceId: input.orderId, kind: 'ORDER_CREDIT' },
        });
        if (existing) {
          this.logger.log({ orderId: input.orderId }, 'Order already credited — skipping');
          return null;
        }

        const result = await this.repository.creditOrderToWallet(input);

        // Fetch the created Payout to publish its bank details
        const payout = await prisma.payout.findUnique({ where: { id: result.payoutId } });
        if (payout) {
          await this.eventPublisher.publishRequested(payout);
        }

        return result;
      },
      { ttlMs: 30_000 }
    );
  }

  /**
   * Process pending payouts. Stub bank transfer: succeeds 90% of the
   * time. Real integration lands in Phase 3.
   */
  async processPendingPayouts(): Promise<{ processed: number; paid: number; failed: number }> {
    const prisma = (await import('@carenest/database')).getPrismaClient();
    const pending = await this.repository.findPendingPayouts(50);
    let paid = 0;
    let failed = 0;

    for (const p of pending) {
      try {
        // Stub: simulate bank transfer. Phase 3 replaces this with a
        // real partner API call.
        const ok = Math.random() > 0.1; // 90% success
        if (!ok) {
          await this.repository.markFailed({ payoutId: p.id, reason: 'Bank API rejected (simulated)' });
          const full = await prisma.payout.findUnique({ where: { id: p.id } });
          if (full) await this.eventPublisher.publishFailed(full, 'Bank API rejected (simulated)');
          failed++;
          continue;
        }

        const transferRef = 'STUB-' + Date.now() + '-' + p.id.slice(0, 8);
        await this.repository.markPaid({ payoutId: p.id, transferRef });
        const full = await prisma.payout.findUnique({ where: { id: p.id } });
        if (full) await this.eventPublisher.publishPaid(full, transferRef);
        paid++;
      } catch (err: any) {
        this.logger.error({ payoutId: p.id, err: err.message }, 'Payout processing error');
        failed++;
      }
    }

    return { processed: pending.length, paid, failed };
  }
}
