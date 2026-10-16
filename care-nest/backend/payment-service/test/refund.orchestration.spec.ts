import { describe, it, expect, beforeEach, vi } from 'vitest';

const prismaState: any = {
  payments: new Map<string, any>(),
  walletEntries: [] as any[],
  payouts: new Map<string, any>(),
  wallet: null as any,
};

vi.mock('@carenest/database', () => ({
  getPrismaClient: () => ({
    payment: {
      findUnique: async ({ where }: any) => {
        if (where.transactionRef) return prismaState.payments.get(where.transactionRef) ?? null;
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
      findFirst: async ({ where }: any) => prismaState.walletEntries.find((e) => {
        if (where.referenceType && e.referenceType !== where.referenceType) return false;
        if (where.referenceId && e.referenceId !== where.referenceId) return false;
        if (where.kind && e.kind !== where.kind) return false;
        return true;
      }) ?? null,
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
    $transaction: async (fn: any) => fn({
      walletEntry: {
        findFirst: async ({ where }: any) => prismaState.walletEntries.find((e) => {
          if (where.referenceType && e.referenceType !== where.referenceType) return false;
          if (where.referenceId && e.referenceId !== where.referenceId) return false;
          if (where.kind && e.kind !== where.kind) return false;
          return true;
        }) ?? null,
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
    ORDER_CREDIT: 'ORDER_CREDIT', COMMISSION_DEBIT: 'COMMISSION_DEBIT',
    REFUND_DEBIT: 'REFUND_DEBIT', PAYOUT_DEBIT: 'PAYOUT_DEBIT', ADJUSTMENT: 'ADJUSTMENT',
  },
}));

vi.mock('@carenest/shared-redis', () => ({ withLock: async (_k: string, fn: any) => fn() }));

const publishOrderRefunded = vi.fn();
vi.mock('../src/kafka/order-event.publisher.js', () => ({
  OrderEventPublisher: class { async publishOrderRefunded(e: any) { publishOrderRefunded(e); } async publishOrderPaid() {} },
}));

import { PaymentsService } from '../src/payments/payments.service.js';

const fakeVnpay = { name: 'VNPAY', createPayment: vi.fn(), verifyWebhook: vi.fn(), refund: vi.fn() };
const fakeMomo = { name: 'MOMO', createPayment: vi.fn(), verifyWebhook: vi.fn(), refund: vi.fn() };
const fakeCod = { name: 'COD', createPayment: vi.fn(), verifyWebhook: vi.fn(), refund: vi.fn() };

const fakePaymentsRepo = {
  findByTransactionRef: async (ref: string) => prismaState.payments.get(ref) ?? null,
  markRefunded: async (ref: string, amount: number) => {
    const p = prismaState.payments.get(ref);
    if (p) {
      p.status = 'REFUNDED';
      p.amount = amount;
    }
    return p;
  },
  findByIdempotencyKey: async () => null,
  findByOrderId: async () => null,
  create: async () => ({}),
  markPaid: async () => ({}),
};

const fakeEscrow = { hold: vi.fn(), release: vi.fn() };
const fakePayouts = {
  reverseCreditForOrder: vi.fn(async ({ orderId, reason }: any) => {
    // emulate repo behavior in-memory
    const credit = prismaState.walletEntries.find(
      (e) => e.referenceType === 'order' && e.referenceId === orderId && e.kind === 'ORDER_CREDIT'
    );
    if (!credit) return { reversed: false, amountVnd: 0 };
    const alreadyReversed = prismaState.walletEntries.find(
      (e) => e.referenceType === 'order' && e.referenceId === orderId && e.kind === 'REFUND_DEBIT'
    );
    if (alreadyReversed) return { reversed: false, amountVnd: Math.abs(Number(alreadyReversed.amountVnd)) };
    const amount = Math.abs(Number(credit.amountVnd));
    if (prismaState.wallet) prismaState.wallet.balanceVnd = Number(prismaState.wallet.balanceVnd) - amount;
    prismaState.walletEntries.push({
      walletId: credit.walletId, kind: 'REFUND_DEBIT', amountVnd: -amount,
      balanceAfterVnd: prismaState.wallet.balanceVnd,
      referenceType: 'order', referenceId: orderId, description: reason,
    });
    return { reversed: true, amountVnd: amount };
  }),
  creditOrderToWallet: vi.fn(),
};

const fakeMetrics = {
  inc: vi.fn(),
  observe: vi.fn(),
  startTimer: vi.fn(() => () => {}),
  render: vi.fn(async () => ''),
  contentType: vi.fn(() => 'text/plain; version=0.0.4'),
  registry: { getSingleMetric: () => null, registerMetric: vi.fn() },
};

describe('PaymentsService.refund (S17 orchestration)', () => {
  beforeEach(() => {
    prismaState.payments.clear();
    prismaState.walletEntries = [];
    prismaState.payouts.clear();
    prismaState.wallet = { id: 'w-1', balanceVnd: 5_000_000, pendingVnd: 0, lifetimeVnd: 10_000_000 };
    publishOrderRefunded.mockReset();
    fakeVnpay.refund.mockReset();
    fakeVnpay.refund.mockResolvedValue({ refundRef: 'VN-REF-1', accepted: true });
  });

  it('rejects when payment is not PAID', async () => {
    prismaState.payments.set('tx-1', {
      id: 'p-1', orderId: 'o-1', transactionRef: 'tx-1', method: 'VNPAY', status: 'PENDING', amount: 1_000_000,
    });
    const svc = new PaymentsService(
      fakePaymentsRepo as any, fakeVnpay as any, fakeMomo as any, fakeCod as any,
      fakeEscrow as any, { publishOrderRefunded } as any, fakePayouts as any, fakeMetrics as any
    );
    await expect(svc.refund('tx-1', { reason: 'x' })).rejects.toThrow(/refund được/);
  });

  it('rejects when payment does not exist', async () => {
    const svc = new PaymentsService(
      fakePaymentsRepo as any, fakeVnpay as any, fakeMomo as any, fakeCod as any,
      fakeEscrow as any, { publishOrderRefunded } as any, fakePayouts as any, fakeMetrics as any
    );
    await expect(svc.refund('missing', { reason: 'x' })).rejects.toThrow(/Không tìm thấy/);
  });

  it('is idempotent — second refund on REFUNDED returns the same payment', async () => {
    prismaState.payments.set('tx-1', {
      id: 'p-1', orderId: 'o-1', transactionRef: 'tx-1', method: 'VNPAY', status: 'REFUNDED', amount: 500_000,
    });
    const svc = new PaymentsService(
      fakePaymentsRepo as any, fakeVnpay as any, fakeMomo as any, fakeCod as any,
      fakeEscrow as any, { publishOrderRefunded } as any, fakePayouts as any, fakeMetrics as any
    );
    const r = await svc.refund('tx-1', { reason: 'x' });
    expect(r.status).toBe('REFUNDED');
    expect(fakeVnpay.refund).not.toHaveBeenCalled();
  });

  it('orchestrates: gateway refund → wallet reverse → mark refunded → publish event', async () => {
    prismaState.payments.set('tx-1', {
      id: 'p-1', orderId: 'o-1', transactionRef: 'tx-1', method: 'VNPAY', status: 'PAID', amount: 1_000_000,
    });
    prismaState.walletEntries.push({
      walletId: 'w-1', kind: 'ORDER_CREDIT', amountVnd: 1_000_000, balanceAfterVnd: 5_000_000,
      referenceType: 'order', referenceId: 'o-1',
    });
    const svc = new PaymentsService(
      fakePaymentsRepo as any, fakeVnpay as any, fakeMomo as any, fakeCod as any,
      fakeEscrow as any, { publishOrderRefunded } as any, fakePayouts as any, fakeMetrics as any
    );
    const r = await svc.refund('tx-1', { reason: 'buyer cancel' });
    expect(r.status).toBe('REFUNDED');
    expect(fakeVnpay.refund).toHaveBeenCalledWith({ transactionRef: 'tx-1', amount: 1_000_000, reason: 'buyer cancel' });
    expect(prismaState.wallet.balanceVnd).toBe(4_000_000);
    expect(publishOrderRefunded).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'o-1', amountVnd: 1_000_000, refundRef: 'VN-REF-1', reason: 'buyer cancel',
    }));
    // S18: metrics are incremented on a successful refund
    expect(fakeMetrics.inc).toHaveBeenCalledWith('refunds_total', expect.objectContaining({ method: 'VNPAY' }));
    expect(fakeMetrics.inc).toHaveBeenCalledWith('payments_total', { method: 'VNPAY', status: 'refunded' });
  });

  it('rejects when gateway refund is rejected', async () => {
    prismaState.payments.set('tx-2', {
      id: 'p-2', orderId: 'o-2', transactionRef: 'tx-2', method: 'VNPAY', status: 'PAID', amount: 100_000,
    });
    fakeVnpay.refund.mockResolvedValueOnce({ refundRef: 'X', accepted: false, message: 'limit exceeded' });
    const svc = new PaymentsService(
      fakePaymentsRepo as any, fakeVnpay as any, fakeMomo as any, fakeCod as any,
      fakeEscrow as any, { publishOrderRefunded } as any, fakePayouts as any, fakeMetrics as any
    );
    await expect(svc.refund('tx-2', { reason: 'r' })).rejects.toThrow(/rejected refund/);
  });
});
