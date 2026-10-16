import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock @carenest/database before importing the service so its
// `getPrismaClient()` returns our in-memory fake.
const prismaState: any = {
  sellers: new Map<string, any>(),
  orders: new Map<string, any>(),
};

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => ({
      seller: {
        findUnique: async ({ where }: any) => {
          if (where.id) return prismaState.sellers.get(where.id) ?? null;
          if (where.userId) {
            for (const s of prismaState.sellers.values()) {
              if (s.userId === where.userId) return s;
            }
          }
          return null;
        },
      },
      order: {
        findMany: async ({ where }: any) => {
          return Array.from(prismaState.orders.values()).filter((o: any) => {
            if (where.sellerId && o.sellerId !== where.sellerId) return false;
            if (where.status?.in && !where.status.in.includes(o.status)) return false;
            if (where.deletedAt === null && o.deletedAt != null) return false;
            if (where.createdAt?.gte && o.createdAt < where.createdAt.gte) return false;
            return true;
          });
        },
      },
    }),
    OrderStatus: {
      DELIVERED: 'DELIVERED',
      SHIPPED: 'SHIPPED',
      PACKING: 'PACKING',
      CONFIRMED: 'CONFIRMED',
      CREATED: 'CREATED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
    },
  };
});

import { AnalyticsService } from '../src/analytics/analytics.service.js';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    prismaState.sellers.clear();
    prismaState.orders.clear();
    service = new AnalyticsService();
    prismaState.sellers.set('seller-1', { id: 'seller-1', userId: 'user-1' });
  });

  it('throws when seller does not exist', async () => {
    await expect(service.getSellerAnalytics('missing', 7)).rejects.toThrow(/not found/);
  });

  it('returns zero-filled daily series for an empty range', async () => {
    const result = await service.getSellerAnalytics('seller-1', 7);
    expect(result.rangeDays).toBe(7);
    expect(result.ordersCount).toBe(0);
    expect(result.totalRevenueVnd).toBe(0);
    expect(result.averageOrderVnd).toBe(0);
    expect(result.daily).toHaveLength(7);
    for (const d of result.daily) {
      expect(d.revenueVnd).toBe(0);
      expect(d.ordersCount).toBe(0);
    }
    expect(result.topProducts).toEqual([]);
  });

  it('aggregates totals and top products across the date range', async () => {
    prismaState.orders.set('o-1', {
      id: 'o-1',
      sellerId: 'user-1',
      status: 'DELIVERED',
      createdAt: daysAgo(1),
      deletedAt: null,
      total: 1_500_000,
      items: [
        { productId: 'p-1', productName: 'Máy đo HA Omron', quantity: 1, lineTotal: 1_500_000 },
      ],
    });
    prismaState.orders.set('o-2', {
      id: 'o-2',
      sellerId: 'user-1',
      status: 'SHIPPED',
      createdAt: daysAgo(2),
      deletedAt: null,
      total: 800_000,
      items: [
        { productId: 'p-1', productName: 'Máy đo HA Omron', quantity: 1, lineTotal: 800_000 },
        { productId: 'p-2', productName: 'Nhiệt kế', quantity: 1, lineTotal: 0 },
      ],
    });
    // Old (outside 7d window) — should be ignored
    prismaState.orders.set('o-old', {
      id: 'o-old',
      sellerId: 'user-1',
      status: 'DELIVERED',
      createdAt: daysAgo(40),
      deletedAt: null,
      total: 9_999_999,
      items: [],
    });
    // Cancelled — should be ignored
    prismaState.orders.set('o-cancelled', {
      id: 'o-cancelled',
      sellerId: 'user-1',
      status: 'CANCELLED',
      createdAt: daysAgo(1),
      deletedAt: null,
      total: 5_000_000,
      items: [],
    });

    const result = await service.getSellerAnalytics('seller-1', 7);
    expect(result.ordersCount).toBe(2);
    expect(result.totalRevenueVnd).toBe(2_300_000);
    expect(result.averageOrderVnd).toBe(1_150_000);
    expect(result.topProducts).toHaveLength(2);
    expect(result.topProducts[0]).toMatchObject({
      productId: 'p-1',
      productName: 'Máy đo HA Omron',
      soldCount: 2,
      revenueVnd: 2_300_000,
    });
  });

  it('returns the correct number of daily buckets', async () => {
    const result30 = await service.getSellerAnalytics('seller-1', 30);
    expect(result30.daily).toHaveLength(30);
    const result90 = await service.getSellerAnalytics('seller-1', 90);
    expect(result90.daily).toHaveLength(90);
  });
});
