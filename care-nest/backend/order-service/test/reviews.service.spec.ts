import { describe, it, expect, beforeEach, vi } from 'vitest';

const prismaState: any = {
  orders: new Map<string, any>(),
  reviews: new Map<string, any>(), // key: orderId
  sellers: new Map<string, any>(),
  users: new Map<string, any>(),
};

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => ({
      order: {
        findUnique: async ({ where }: any) => prismaState.orders.get(where.id) ?? null,
      },
      review: {
        findUnique: async ({ where }: any) => prismaState.reviews.get(where.orderId) ?? null,
        create: async ({ data }: any) => {
          const row = {
            id: `r-${prismaState.reviews.size + 1}`,
            ...data,
            createdAt: new Date(),
          };
          prismaState.reviews.set(data.orderId, row);
          return row;
        },
        findMany: async ({ where, take = 10, skip = 0, orderBy, include }: any) => {
          let rows = Array.from(prismaState.reviews.values()).filter((r: any) =>
            !where?.sellerId || r.sellerId === where.sellerId
          );
          if (orderBy?.createdAt === 'desc') {
            rows = rows.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          rows = rows.slice(skip, skip + take);
          if (include?.buyer) {
            return rows.map((r: any) => ({
              ...r,
              buyer: { fullName: prismaState.users.get(r.buyerId)?.fullName ?? 'Unknown' },
            }));
          }
          return rows;
        },
        count: async ({ where }: any) =>
          Array.from(prismaState.reviews.values()).filter((r: any) =>
            !where?.sellerId || r.sellerId === where.sellerId
          ).length,
      },
      seller: {
        findUnique: async ({ where, select }: any) => {
          const s = prismaState.sellers.get(where.id);
          if (!s) return null;
          if (select) {
            const out: any = {};
            for (const k of Object.keys(select)) out[k] = s[k];
            return out;
          }
          return s;
        },
      },
    }),
    OrderStatus: { DELIVERED: 'DELIVERED' },
  };
});

import { ReviewsService } from '../src/reviews/reviews.service.js';

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(() => {
    prismaState.orders.clear();
    prismaState.reviews.clear();
    prismaState.sellers.clear();
    prismaState.users.clear();
    service = new ReviewsService();

    prismaState.users.set('user-1', { id: 'user-1', fullName: 'Nguyen Van A' });
    prismaState.users.set('user-2', { id: 'user-2', fullName: 'Tran Thi B' });
    prismaState.sellers.set('seller-1', {
      id: 'seller-1',
      ratingAvg: 0,
      ratingCount: 0,
    });
    prismaState.orders.set('order-1', {
      id: 'order-1',
      buyerId: 'user-1',
      sellerId: 'seller-1',
      status: 'DELIVERED',
    });
    prismaState.orders.set('order-2', {
      id: 'order-2',
      buyerId: 'user-1',
      sellerId: 'seller-1',
      status: 'CREATED', // not delivered
    });
    prismaState.orders.set('order-3', {
      id: 'order-3',
      buyerId: 'user-2', // different buyer
      sellerId: 'seller-1',
      status: 'DELIVERED',
    });
  });

  it('rejects rating out of range', async () => {
    await expect(
      service.create('user-1', { orderId: 'order-1', rating: 0 })
    ).rejects.toThrow(/between 1 and 5/);
    await expect(
      service.create('user-1', { orderId: 'order-1', rating: 6 })
    ).rejects.toThrow(/between 1 and 5/);
    // NaN — not a valid integer even after Math.trunc
    await expect(
      service.create('user-1', { orderId: 'order-1', rating: NaN })
    ).rejects.toThrow(/between 1 and 5/);
  });

  it('rejects review of order that is not delivered', async () => {
    await expect(
      service.create('user-1', { orderId: 'order-2', rating: 5 })
    ).rejects.toThrow(/Only delivered/);
  });

  it('rejects review by a non-buyer', async () => {
    await expect(
      service.create('user-2', { orderId: 'order-1', rating: 5 })
    ).rejects.toThrow(/your own orders/);
  });

  it('creates a review for a delivered order', async () => {
    const r = await service.create('user-1', { orderId: 'order-1', rating: 5, comment: 'Great!' });
    expect(r.rating).toBe(5);
    expect(r.comment).toBe('Great!');
    expect(r.buyerId).toBe('user-1');
    expect(r.sellerId).toBe('seller-1');
  });

  it('rejects duplicate review on the same order', async () => {
    await service.create('user-1', { orderId: 'order-1', rating: 4 });
    await expect(
      service.create('user-1', { orderId: 'order-1', rating: 5 })
    ).rejects.toThrow(/already been reviewed/);
  });

  it('lists reviews for a seller with paginated metadata', async () => {
    await service.create('user-1', { orderId: 'order-1', rating: 5, comment: 'Excellent' });
    await service.create('user-2', { orderId: 'order-3', rating: 3 });
    prismaState.sellers.get('seller-1').ratingAvg = 4;
    prismaState.sellers.get('seller-1').ratingCount = 2;

    const res = await service.listForSeller('seller-1', 10, 0);
    expect(res.total).toBe(2);
    expect(res.averageRating).toBe(4);
    expect(res.ratingCount).toBe(2);
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toMatchObject({
      rating: 5,
      comment: 'Excellent',
      buyerName: 'Nguyen Van A',
    });
  });

  it('returns 404 for unknown seller on list', async () => {
    await expect(service.listForSeller('missing', 10, 0)).rejects.toThrow(/not found/);
  });
});
