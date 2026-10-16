import { ORDER_API, apiFetch, getToken } from '../api-client';
import type { AnalyticsSummary } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_ANALYTICS: AnalyticsSummary = {
  rangeDays: 7,
  totalRevenueVnd: 18_400_000,
  ordersCount: 12,
  averageOrderVnd: 1_533_333,
  daily: [
    { date: '2025-10-09', revenueVnd: 2_100_000, ordersCount: 2 },
    { date: '2025-10-10', revenueVnd: 0, ordersCount: 0 },
    { date: '2025-10-11', revenueVnd: 4_800_000, ordersCount: 3 },
    { date: '2025-10-12', revenueVnd: 1_200_000, ordersCount: 1 },
    { date: '2025-10-13', revenueVnd: 0, ordersCount: 0 },
    { date: '2025-10-14', revenueVnd: 6_500_000, ordersCount: 4 },
    { date: '2025-10-15', revenueVnd: 3_800_000, ordersCount: 2 },
  ],
  topProducts: [
    { productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', soldCount: 7, revenueVnd: 17_430_000 },
    { productId: 'p-2', productName: 'Nhiệt kế Microlife MT 550', soldCount: 3, revenueVnd: 2_670_000 },
  ],
};

export const analyticsService = {
  async summary(days = 7): Promise<AnalyticsSummary> {
    if (USE_MOCK) return { ...MOCK_ANALYTICS, rangeDays: days };
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<AnalyticsSummary>(`${ORDER_API}/api/v1/orders/analytics?days=${days}`, { token });
  },
};
