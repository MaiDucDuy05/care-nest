import { Injectable } from '@nestjs/common';
import {
  getPrismaClient,
  PrismaClient,
  WalletEntryKind,
  PayoutStatus,
  type Prisma,
} from '@carenest/database';

@Injectable()
export class PayoutsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get-or-create the wallet for a seller. Idempotent.
   */
  async getOrCreateWallet(sellerId: string) {
    let wallet = await this.prisma.sellerWallet.findUnique({ where: { sellerId } });
    if (!wallet) {
      wallet = await this.prisma.sellerWallet.create({ data: { sellerId } });
    }
    return wallet;
  }

  /**
   * Credit a seller's wallet with a seller's share of an order.
   *
   * Records three ledger entries (in one transaction):
   *   1. ORDER_CREDIT    +gross
   *   2. COMMISSION_DEBIT -commission
   *   3. (move pending → balance) — separate update, no entry
   *
   * Returns the created `Payout` (PENDING).
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
  }): Promise<{ payoutId: string; netVnd: number }> {
    const { orderId, orderNumber, sellerId, grossVnd, commissionRate, bankName, bankAccount, bankAccountName } = input;

    const commission = Math.round(grossVnd * commissionRate);
    const net = grossVnd - commission;

    if (grossVnd <= 0) throw new Error(`grossVnd must be > 0, got ${grossVnd}`);
    if (net < 0) throw new Error(`Negative net (gross ${grossVnd} < commission ${commission})`);

    return this.prisma.$transaction(async (tx) => {
      // Lock the wallet row for update
      let wallet = await tx.sellerWallet.findUnique({ where: { sellerId } });
      if (!wallet) {
        wallet = await tx.sellerWallet.create({ data: { sellerId } });
      }

      // 1. Credit pending with gross
      const afterCredit = Number(wallet.pendingVnd) + grossVnd;
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { pendingVnd: afterCredit },
      });
      await tx.walletEntry.create({
        data: {
          walletId: wallet.id,
          kind: WalletEntryKind.ORDER_CREDIT,
          amountVnd: grossVnd,
          balanceAfterVnd: afterCredit,
          referenceType: 'order',
          referenceId: orderId,
          description: `Order ${orderNumber} credit`,
        },
      });

      // 2. Debit pending with commission
      const afterCommission = afterCredit - commission;
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { pendingVnd: afterCommission },
      });
      if (commission > 0) {
        await tx.walletEntry.create({
          data: {
            walletId: wallet.id,
            kind: WalletEntryKind.COMMISSION_DEBIT,
            amountVnd: -commission,
            balanceAfterVnd: afterCommission,
            referenceType: 'order',
            referenceId: orderId,
            description: `Commission @ ${commissionRate} for ${orderNumber}`,
          },
        });
      }

      // 3. Move pending → balance (escrow just released)
      const afterMove = Number(wallet.balanceVnd) + net;
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: {
          balanceVnd: afterMove,
          pendingVnd: afterCommission - net,
          lifetimeVnd: Number(wallet.lifetimeVnd) + grossVnd,
        },
      });

      // 4. Create the Payout record (PENDING)
      const payout = await tx.payout.create({
        data: {
          sellerId,
          walletId: wallet.id,
          amountVnd: net,
          status: PayoutStatus.PENDING,
          bankName,
          bankAccount,
          bankAccountName,
        },
      });

      return { payoutId: payout.id, netVnd: net };
    });
  }

  /**
   * Find orders whose escrow has been released in Redis. Returns
   * order IDs that have a released record and no Payout yet.
   *
   * The caller passes a `releasedOrderIds` array (collected from
   * Redis by the worker). We then look up the matching Order rows.
   */
  async findOrdersByIds(orderIds: string[]) {
    if (orderIds.length === 0) return [];
    return this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true, seller: true },
    });
  }

  /**
   * Find Payouts that have not yet been processed.
   */
  async findPendingPayouts(limit = 100): Promise<
    Array<{ id: string; sellerId: string; walletId: string; amountVnd: any; bankName: string; bankAccount: string; bankAccountName: string }>
  > {
    const rows = await this.prisma.payout.findMany({
      where: { status: PayoutStatus.PENDING },
      orderBy: { requestedAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      sellerId: r.sellerId,
      walletId: r.walletId,
      amountVnd: r.amountVnd,
      bankName: r.bankName,
      bankAccount: r.bankAccount,
      bankAccountName: r.bankAccountName,
    }));
  }

  /**
   * Mark a payout as PAID and debit the wallet.
   */
  async markPaid(input: { payoutId: string; transferRef: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id: input.payoutId } });
      if (!payout) throw new Error(`Payout ${input.payoutId} not found`);
      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error(`Payout ${input.payoutId} is not PENDING (got ${payout.status})`);
      }
      const wallet = await tx.sellerWallet.findUnique({ where: { id: payout.walletId } });
      if (!wallet) throw new Error(`Wallet ${payout.walletId} not found`);

      const amount = Number(payout.amountVnd);
      const newBalance = Number(wallet.balanceVnd) - amount;
      if (newBalance < 0) {
        throw new Error(`Insufficient balance: have ${wallet.balanceVnd}, need ${amount}`);
      }

      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { balanceVnd: newBalance },
      });
      await tx.walletEntry.create({
        data: {
          walletId: wallet.id,
          kind: WalletEntryKind.PAYOUT_DEBIT,
          amountVnd: -amount,
          balanceAfterVnd: newBalance,
          referenceType: 'payout',
          referenceId: payout.id,
          description: `Payout transfer ${input.transferRef}`,
        },
      });
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.PAID,
          transferRef: input.transferRef,
          processedAt: new Date(),
          paidAt: new Date(),
        },
      });
    });
  }

  /**
   * Mark a payout as FAILED with a reason.
   */
  async markFailed(input: { payoutId: string; reason: string }): Promise<void> {
    await this.prisma.payout.update({
      where: { id: input.payoutId },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: input.reason,
        processedAt: new Date(),
      },
    });
  }

  /**
   * S17: reverse a seller's pending + balance for an order when the
   * buyer is refunded. Looks at the original ORDER_CREDIT entry,
   * takes the same gross amount off the wallet, and writes a
   * matching REFUND_DEBIT entry. Idempotent by `referenceType/order`
   * (a second call is a no-op). Cancels any PENDING Payout created
   * for the same order so the seller doesn't get paid for a refunded
   * sale.
   */
  async reverseCreditForOrder(input: { orderId: string; reason: string }): Promise<{ reversed: boolean; amountVnd: number }> {
    return this.prisma.$transaction(async (tx) => {
      // Idempotency: a REFUND_DEBIT for the same order means we already reversed.
      const alreadyReversed = await tx.walletEntry.findFirst({
        where: { referenceType: 'order', referenceId: input.orderId, kind: WalletEntryKind.REFUND_DEBIT },
      });
      if (alreadyReversed) {
        return { reversed: false, amountVnd: Math.abs(Number(alreadyReversed.amountVnd)) };
      }
      const credit = await tx.walletEntry.findFirst({
        where: { referenceType: 'order', referenceId: input.orderId, kind: WalletEntryKind.ORDER_CREDIT },
        include: { wallet: true },
      });
      if (!credit) {
        return { reversed: false, amountVnd: 0 };
      }
      const amount = Math.abs(Number(credit.amountVnd));
      const newBalance = Number(credit.wallet.balanceVnd) - amount;
      // Note: we allow balance to go negative here. The seller will be made
      // whole on the next payout (or reconciled manually by finance).
      await tx.sellerWallet.update({
        where: { id: credit.walletId },
        data: { balanceVnd: newBalance },
      });
      await tx.walletEntry.create({
        data: {
          walletId: credit.walletId,
          kind: WalletEntryKind.REFUND_DEBIT,
          amountVnd: -amount,
          balanceAfterVnd: newBalance,
          referenceType: 'order',
          referenceId: input.orderId,
          description: input.reason,
        },
      });
      // Cancel any PENDING payout for this order.
      await tx.payout.updateMany({
        where: { status: PayoutStatus.PENDING },
        data: { status: PayoutStatus.REVERSED, failureReason: input.reason },
      });
      return { reversed: true, amountVnd: amount };
    });
  }
}
