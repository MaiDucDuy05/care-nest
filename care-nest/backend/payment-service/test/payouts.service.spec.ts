import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock @carenest/shared-redis so the service can call withLock without a real Redis
vi.mock('@carenest/shared-redis', () => ({
  withLock: vi.fn(async (_key: string, fn: () => Promise<unknown>) => fn()),
  getRedis: vi.fn(() => null),
}));

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => mockPrisma,
    WalletEntryKind: {
      ORDER_CREDIT: 'ORDER_CREDIT',
      COMMISSION_DEBIT: 'COMMISSION_DEBIT',
      PAYOUT_DEBIT: 'PAYOUT_DEBIT',
      REFUND_DEBIT: 'REFUND_DEBIT',
      ADJUSTMENT: 'ADJUSTMENT',
    },
    PayoutStatus: {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      PAID: 'PAID',
      FAILED: 'FAILED',
      REVERSED: 'REVERSED',
    },
  };
});

// In-memory mock Prisma. The creditOrderToWallet method does its work
// via prisma.$transaction, so we need to simulate that by collecting
// calls and returning shaped results.
type Entry = {
  walletId: string;
  kind: string;
  amountVnd: number;
  balanceAfterVnd: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
};

const wallets = new Map<string, any>();
const entries: Entry[] = [];
const payouts: any[] = [];

const mockPrisma = {
  $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
  sellerWallet: {
    findUnique: async ({ where }: any) => wallets.get(where.sellerId) ?? null,
    create: async ({ data }: any) => {
      const w = {
        id: 'wallet-' + data.sellerId,
        sellerId: data.sellerId,
        balanceVnd: 0,
        pendingVnd: 0,
        lifetimeVnd: 0,
        currency: 'VND',
      };
      wallets.set(data.sellerId, w);
      return w;
    },
    update: async ({ where, data }: any) => {
      const w = wallets.get(where.id.replace(/^wallet-/, '')) ?? wallets.values().next().value;
      Object.assign(w, data);
      return w;
    },
  },
  walletEntry: {
    findFirst: async ({ where }: any) =>
      entries.find(
        (e) => e.referenceType === where.referenceType && e.referenceId === where.referenceId && e.kind === where.kind
      ) ?? null,
    create: async ({ data }: any) => {
      entries.push({ ...data });
      return data;
    },
  },
  payout: {
    create: async ({ data }: any) => {
      const p = { id: 'payout-' + payouts.length, ...data, requestedAt: new Date() };
      payouts.push(p);
      return p;
    },
    findUnique: async ({ where }: any) => payouts.find((p) => p.id === where.id) ?? null,
  },
};

import { PayoutsService } from '../src/payouts/payouts.service.js';
import { PayoutsRepository } from '../src/payouts/payouts.repository.js';
import { PayoutEventPublisher } from '../src/payouts/payout-event.publisher.js';

const noopPublisher = {
  publishRequested: async () => {},
  publishPaid: async () => {},
  publishFailed: async () => {},
} as unknown as PayoutEventPublisher;

describe('PayoutsService.creditOrderToWallet', () => {
  let service: PayoutsService;
  const sellerId = 'seller-1';

  beforeEach(() => {
    wallets.clear();
    entries.length = 0;
    payouts.length = 0;
    const repo = new PayoutsRepository();
    service = new PayoutsService(repo, noopPublisher);
  });

  it('credits gross and debits commission at 10%', async () => {
    const result = await service.creditOrderToWallet({
      orderId: 'order-1',
      orderNumber: 'CN-001',
      sellerId,
      grossVnd: 1_000_000,
      commissionRate: 0.1,
      bankName: 'VCB',
      bankAccount: '1234567890',
      bankAccountName: 'Nguyen Van A',
    });
    expect(result).not.toBeNull();
    expect(result!.netVnd).toBe(900_000);

    // Two ledger entries: +1,000,000 ORDER_CREDIT and -100,000 COMMISSION_DEBIT
    const credit = entries.find((e) => e.kind === 'ORDER_CREDIT');
    const commission = entries.find((e) => e.kind === 'COMMISSION_DEBIT');
    expect(credit!.amountVnd).toBe(1_000_000);
    expect(credit!.balanceAfterVnd).toBe(1_000_000);
    expect(commission!.amountVnd).toBe(-100_000);
    expect(commission!.balanceAfterVnd).toBe(900_000);

    // Payout created with the net
    expect(payouts).toHaveLength(1);
    expect(payouts[0].amountVnd).toBe(900_000);
    expect(payouts[0].status).toBe('PENDING');
  });

  it('handles zero commission cleanly', async () => {
    const result = await service.creditOrderToWallet({
      orderId: 'order-2',
      orderNumber: 'CN-002',
      sellerId,
      grossVnd: 500_000,
      commissionRate: 0,
      bankName: 'VCB',
      bankAccount: '1234567890',
      bankAccountName: 'A',
    });
    expect(result!.netVnd).toBe(500_000);
    const commission = entries.find((e) => e.kind === 'COMMISSION_DEBIT');
    expect(commission).toBeUndefined(); // no entry when commission is 0
  });

  it('is idempotent on second call for the same order', async () => {
    const args = {
      orderId: 'order-3',
      orderNumber: 'CN-003',
      sellerId,
      grossVnd: 100_000,
      commissionRate: 0.1,
      bankName: 'VCB',
      bankAccount: '1234567890',
      bankAccountName: 'A',
    };
    const a = await service.creditOrderToWallet(args);
    const b = await service.creditOrderToWallet(args);
    expect(a).not.toBeNull();
    expect(b).toBeNull(); // second call skipped
    expect(payouts).toHaveLength(1);
  });

  it('handles commission greater than gross by failing safely', async () => {
    // 1 VND gross, 99% commission -> 0 net but commission 1 (rounded up)
    // Negative-net test: 1 VND gross, 150% commission
    await expect(
      service.creditOrderToWallet({
        orderId: 'order-4',
        orderNumber: 'CN-004',
        sellerId,
        grossVnd: 1_000,
        commissionRate: 1.5, // 150%
        bankName: 'VCB',
        bankAccount: '1234567890',
        bankAccountName: 'A',
      })
    ).rejects.toThrow(/Negative net/);
  });
});
