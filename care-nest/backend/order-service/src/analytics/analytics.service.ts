import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, OrderStatus, type Prisma } from '@carenest/database';

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  revenueVnd: number;
  ordersCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  soldCount: number;
  revenueVnd: number;
}

export interface AnalyticsSummary {
  rangeDays: number;
  totalRevenueVnd: number;
  ordersCount: number;
  averageOrderVnd: number;
  daily: DailyRevenue[];
  topProducts: TopProduct[];
}

/**
 * Seller analytics aggregator. Pure read path over the existing
 * `orders` + `order_items` tables. No caching — the query is
 * indexed by `sellerId` and bounded to a date range so it's fast
 * even at small scale. Phase 2.3 will add Prometheus metrics around
 * this so we can detect regressions.
 */
@Injectable()
export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Validate and return the canonical seller id. Order.sellerId references
   * Seller.id, not User.id.
   */
  private async resolveSellerId(sellerId: string): Promise<string> {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });
    if (!seller) throw new NotFoundException(`Seller ${sellerId} not found`);
    return seller.id;
  }

  async getSellerAnalytics(sellerId: string, days: number): Promise<AnalyticsSummary> {
    const resolvedSellerId = await this.resolveSellerId(sellerId);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    // Pull all completed orders in range (DELIVERED counts as revenue)
    const orders = await this.prisma.order.findMany({
      where: {
        sellerId: resolvedSellerId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PACKING, OrderStatus.CONFIRMED] },
        createdAt: { gte: since },
        deletedAt: null,
      },
      include: {
        items: {
          select: { productId: true, productName: true, quantity: true, lineTotal: true },
        },
      },
    });

    // Aggregate totals
    const totalRevenueVnd = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const ordersCount = orders.length;
    const averageOrderVnd = ordersCount > 0 ? Math.round(totalRevenueVnd / ordersCount) : 0;

    // Daily breakdown: zero-fill the date range
    const dailyMap = new Map<string, { revenueVnd: number; ordersCount: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { revenueVnd: 0, ordersCount: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key) ?? { revenueVnd: 0, ordersCount: 0 };
      entry.revenueVnd += Number(o.total);
      entry.ordersCount += 1;
      dailyMap.set(key, entry);
    }
    const daily: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      revenueVnd: v.revenueVnd,
      ordersCount: v.ordersCount,
    }));

    // Top products: aggregate by productId
    const productMap = new Map<string, { productName: string; soldCount: number; revenueVnd: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cur = productMap.get(it.productId) ?? { productName: it.productName, soldCount: 0, revenueVnd: 0 };
        cur.soldCount += it.quantity;
        cur.revenueVnd += Number(it.lineTotal);
        productMap.set(it.productId, cur);
      }
    }
    const topProducts: TopProduct[] = Array.from(productMap.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenueVnd - a.revenueVnd)
      .slice(0, 5);

    return {
      rangeDays: days,
      totalRevenueVnd,
      ordersCount,
      averageOrderVnd,
      daily,
      topProducts,
    };
  }
}
