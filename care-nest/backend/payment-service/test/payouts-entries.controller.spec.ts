import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock @carenest/shared-redis so the controller can be instantiated
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

// In-memory mock Prisma
type Entry = {
  id: string;
  walletId: string;
  kind: string;
  amountVnd: number;
  balanceAfterVnd: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
};

const sellers = new Map<string, { id: string; userId: string }>();
const wallets = new Map<string, { id: string; sellerId: string }>();
const entries: Entry[] = [];

const mockPrisma = {
  seller: {
    findUnique: async ({ where }: any) => sellers.get(where.userId) ?? null,
  },
  sellerWallet: {
    findUnique: async ({ where }: any) => wallets.get(where.sellerId) ?? null,
  },
  walletEntry: {
    findMany: async ({ where, orderBy, skip, take }: any) => {
      let rows = entries.filter((e) => e.walletId === where.walletId);
      if (where.kind) rows = rows.filter((e) => e.kind === where.kind);
      rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
    },
    count: async ({ where }: any) => {
      let rows = entries.filter((e) => e.walletId === where.walletId);
      if (where.kind) rows = rows.filter((e) => e.kind === where.kind);
      return rows.length;
    },
  },
};

import { PayoutsController } from '../src/payouts/payouts.controller';
import { PayoutsService } from '../src/payouts/payouts.service';
import { PayoutsRepository } from '../src/payouts/payouts.repository';

const user = { id: 'u-1' };
const ctx = { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as any;

describe('PayoutsController.listEntries (S17 escrow timeline)', () => {
  let controller: PayoutsController;

  beforeEach(() => {
    sellers.clear();
    wallets.clear();
    entries.length = 0;
    const repo = new PayoutsRepository();
    const service = new PayoutsService(repo, {} as any);
    controller = new PayoutsController(service, repo);
  });

  it('returns empty when seller has no row', async () => {
    const res = await controller.listEntries(user, {});
    expect(res).toEqual({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false });
  });

  it('returns empty when seller has no wallet', async () => {
    sellers.set('u-1', { id: 's-1', userId: 'u-1' });
    const res = await controller.listEntries(user, {});
    expect(res).toEqual({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false });
  });

  it('returns paginated entries newest-first for the seller', async () => {
    sellers.set('u-1', { id: 's-1', userId: 'u-1' });
    wallets.set('s-1', { id: 'w-1', sellerId: 's-1' });
    const now = Date.now();
    entries.push(
      { id: 'e-1', walletId: 'w-1', kind: 'ORDER_CREDIT', amountVnd: 1_000_000, balanceAfterVnd: 1_000_000, referenceType: 'order', referenceId: 'o-1', description: 'Order o-1', createdAt: new Date(now - 3000) },
      { id: 'e-2', walletId: 'w-1', kind: 'COMMISSION_DEBIT', amountVnd: -100_000, balanceAfterVnd: 900_000, referenceType: 'order', referenceId: 'o-1', description: 'Commission', createdAt: new Date(now - 2000) },
      { id: 'e-3', walletId: 'w-1', kind: 'REFUND_DEBIT', amountVnd: -1_000_000, balanceAfterVnd: -100_000, referenceType: 'order', referenceId: 'o-1', description: 'Refund for o-1', createdAt: new Date(now - 1000) },
    );

    const res = await controller.listEntries(user, {});
    expect(res.total).toBe(3);
    expect(res.items).toHaveLength(3);
    expect((res.items[0] as any).id).toBe('e-3'); // newest first
    expect((res.items[2] as any).id).toBe('e-1');
    expect((res.items[0] as any).amountVnd).toBe(-1_000_000);
    expect((res.items[0] as any).kind).toBe('REFUND_DEBIT');
  });

  it('filters by kind=REFUND_DEBIT', async () => {
    sellers.set('u-1', { id: 's-1', userId: 'u-1' });
    wallets.set('s-1', { id: 'w-1', sellerId: 's-1' });
    entries.push(
      { id: 'e-1', walletId: 'w-1', kind: 'ORDER_CREDIT', amountVnd: 1_000_000, balanceAfterVnd: 1_000_000, referenceType: 'order', referenceId: 'o-1', description: 'Credit', createdAt: new Date(Date.now() - 2000) },
      { id: 'e-2', walletId: 'w-1', kind: 'REFUND_DEBIT', amountVnd: -500_000, balanceAfterVnd: 500_000, referenceType: 'order', referenceId: 'o-2', description: 'Refund o-2', createdAt: new Date(Date.now() - 1000) },
      { id: 'e-3', walletId: 'w-1', kind: 'REFUND_DEBIT', amountVnd: -200_000, balanceAfterVnd: 300_000, referenceType: 'order', referenceId: 'o-3', description: 'Refund o-3', createdAt: new Date() },
    );

    const res = await controller.listEntries(user, { kind: 'REFUND_DEBIT' });
    expect(res.total).toBe(2);
    expect(res.items).toHaveLength(2);
    expect((res.items[0] as any).kind).toBe('REFUND_DEBIT');
    expect((res.items[1] as any).kind).toBe('REFUND_DEBIT');
  });

  it('paginates with pageSize', async () => {
    sellers.set('u-1', { id: 's-1', userId: 'u-1' });
    wallets.set('s-1', { id: 'w-1', sellerId: 's-1' });
    for (let i = 0; i < 5; i++) {
      entries.push({
        id: `e-${i}`,
        walletId: 'w-1',
        kind: 'ORDER_CREDIT',
        amountVnd: 100_000,
        balanceAfterVnd: 100_000 * (i + 1),
        referenceType: 'order',
        referenceId: `o-${i}`,
        description: `Order o-${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      });
    }
    const res = await controller.listEntries(user, { page: 2, pageSize: 2 });
    expect(res.total).toBe(5);
    expect(res.items).toHaveLength(2);
    // entries inserted e-0 (newest) → e-4 (oldest), 1s apart
    // sorted desc: e-0, e-1, e-2, e-3, e-4
    // page=2, pageSize=2 → rows[2..4] = e-2, e-3
    expect((res.items[0] as any).id).toBe('e-2');
    expect((res.items[1] as any).id).toBe('e-3');
    expect(res.hasMore).toBe(true);
  });

  it('rejects unknown kind values', async () => {
    await expect(controller.listEntries(user, { kind: 'NOT_A_KIND' })).rejects.toThrow();
  });
});
