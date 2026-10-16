import { describe, it, expect, beforeEach, vi } from 'vitest';

const prismaState: any = {
  payments: new Map<string, any>(), // key: transactionRef
  walletEntries: [] as any[],
  payouts: new Map<string, any>(),
  wallet: null as any,
  webhookEvents: [] as any[],
};

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => ({
      payment: {
        findUnique: async ({ where }: any) => {
          if (where.transactionRef) return prismaState.payments.get(where.transactionRef) ?? null;
          if (where.id) {
            for (const p of prismaState.payments.values()) if (p.id === where.id) return p;
          }
          return null;
        },
        update: async ({ where, data }: any) => {
          for (const p of prismaState.payments.values()) {
            if (p.transactionRef === where.transactionRef) {
              Object.assign(p, data);
              return p;
            }
          }
          return null;
        },
      },
      walletEntry: {
        findFirst: async ({ where, include }: any) => {
          const row = prismaState.walletEntries.find((e) => {
            if (where.referenceType && e.referenceType !== where.referenceType) return false;
            if (where.referenceId && e.referenceId !== where.referenceId) return false;
            if (where.kind && e.kind !== where.kind) return false;
            return true;
          }) ?? null;
          if (!row) return null;
          if (include?.wallet) {
            return { ...row, wallet: prismaState.wallet };
          }
          return row;
        },
        create: async ({ data }: any) => {
          const row = { id: `we-${prismaState.walletEntries.length + 1}`, ...data };
          prismaState.walletEntries.push(row);
          return row;
        },
      },
      sellerWallet: {
        findUnique: async ({ where }: any) => prismaState.wallet,
        update: async ({ where, data }: any) => {
          if (prismaState.wallet) Object.assign(prismaState.wallet, data);
          return prismaState.wallet;
        },
      },
      payout: {
        updateMany: async ({ where, data }: any) => {
          for (const p of prismaState.payouts.values()) {
            if (!where.status || p.status === where.status) Object.assign(p, data);
          }
          return { count: prismaState.payouts.size };
        },
      },
      $transaction: async (fn: any) => fn({
        walletEntry: {
          findFirst: async ({ where, include }: any) => {
            const row = prismaState.walletEntries.find((e) => {
              if (where.referenceType && e.referenceType !== where.referenceType) return false;
              if (where.referenceId && e.referenceId !== where.referenceId) return false;
              if (where.kind && e.kind !== where.kind) return false;
              return true;
            }) ?? null;
            if (!row) return null;
            if (include?.wallet) return { ...row, wallet: prismaState.wallet };
            return row;
          },
          create: async ({ data }: any) => {
            const row = { id: `we-${prismaState.walletEntries.length + 1}`, ...data };
            prismaState.walletEntries.push(row);
            return row;
          },
        },
        sellerWallet: {
          findUnique: async () => prismaState.wallet,
          update: async ({ data }: any) => {
            if (prismaState.wallet) Object.assign(prismaState.wallet, data);
            return prismaState.wallet;
          },
        },
        payout: {
          updateMany: async ({ where, data }: any) => {
            for (const p of prismaState.payouts.values()) {
              if (!where.status || p.status === where.status) Object.assign(p, data);
            }
            return { count: prismaState.payouts.size };
          },
        },
      }),
    }),
    PaymentStatus: { PENDING: 'PENDING', PAID: 'PAID', REFUNDED: 'REFUNDED', FAILED: 'FAILED' },
    PaymentMethod: { VNPAY: 'VNPAY', MOMO: 'MOMO', COD: 'COD' },
    PayoutStatus: { PENDING: 'PENDING', PAID: 'PAID', FAILED: 'FAILED', REVERSED: 'REVERSED' },
    WalletEntryKind: {
      ORDER_CREDIT: 'ORDER_CREDIT',
      COMMISSION_DEBIT: 'COMMISSION_DEBIT',
      REFUND_DEBIT: 'REFUND_DEBIT',
      PAYOUT_DEBIT: 'PAYOUT_DEBIT',
      ADJUSTMENT: 'ADJUSTMENT',
    },
  };
});

vi.mock('@carenest/shared-redis', () => ({
  withLock: async (_key: string, fn: any) => fn(),
}));

import { PayoutsRepository } from '../src/payouts/payouts.repository.js';

describe('PayoutsRepository.reverseCreditForOrder (S17)', () => {
  beforeEach(() => {
    prismaState.payments.clear();
    prismaState.walletEntries = [];
    prismaState.payouts.clear();
    prismaState.wallet = {
      id: 'wallet-1',
      sellerId: 'seller-1',
      balanceVnd: 5_000_000,
      pendingVnd: 1_000_000,
      lifetimeVnd: 10_000_000,
    };
  });

  it('reverses a credit by debiting the wallet and stamping a REFUND_DEBIT entry', async () => {
    prismaState.walletEntries.push({
      id: 'we-1',
      walletId: 'wallet-1',
      kind: 'ORDER_CREDIT',
      amountVnd: 2_000_000,
      balanceAfterVnd: 5_000_000,
      referenceType: 'order',
      referenceId: 'order-1',
    });
    const repo = new PayoutsRepository();
    const r = await repo.reverseCreditForOrder({ orderId: 'order-1', reason: 'buyer cancel' });
    expect(r.reversed).toBe(true);
    expect(r.amountVnd).toBe(2_000_000);
    expect(prismaState.wallet.balanceVnd).toBe(3_000_000);
    const refund = prismaState.walletEntries.find((e) => e.kind === 'REFUND_DEBIT');
    expect(refund).toBeTruthy();
    expect(refund.amountVnd).toBe(-2_000_000);
    expect(refund.balanceAfterVnd).toBe(3_000_000);
  });

  it('is idempotent — second call is a no-op', async () => {
    prismaState.walletEntries.push({
      id: 'we-1', walletId: 'wallet-1', kind: 'ORDER_CREDIT', amountVnd: 1_500_000,
      balanceAfterVnd: 5_000_000, referenceType: 'order', referenceId: 'order-2',
    });
    const repo = new PayoutsRepository();
    const r1 = await repo.reverseCreditForOrder({ orderId: 'order-2', reason: 'r1' });
    expect(r1.reversed).toBe(true);
    const r2 = await repo.reverseCreditForOrder({ orderId: 'order-2', reason: 'r2' });
    expect(r2.reversed).toBe(false);
    expect(r2.amountVnd).toBe(1_500_000);
  });

  it('cancels any PENDING Payout for the order', async () => {
    prismaState.walletEntries.push({
      id: 'we-1', walletId: 'wallet-1', kind: 'ORDER_CREDIT', amountVnd: 800_000,
      balanceAfterVnd: 5_000_000, referenceType: 'order', referenceId: 'order-3',
    });
    prismaState.payouts.set('p-1', { id: 'p-1', status: 'PENDING' });
    const repo = new PayoutsRepository();
    await repo.reverseCreditForOrder({ orderId: 'order-3', reason: 'refund' });
    expect(prismaState.payouts.get('p-1').status).toBe('REVERSED');
    expect(prismaState.payouts.get('p-1').failureReason).toBe('refund');
  });

  it('returns no-op when no ORDER_CREDIT exists for the order', async () => {
    const repo = new PayoutsRepository();
    const r = await repo.reverseCreditForOrder({ orderId: 'order-missing', reason: 'r' });
    expect(r.reversed).toBe(false);
    expect(r.amountVnd).toBe(0);
  });
});
