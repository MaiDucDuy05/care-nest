import { PAYMENT_API, apiFetch, getToken } from '../api-client';
import type { Payout, PayoutStatus, SellerWallet } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_WALLET: SellerWallet = {
  balanceVnd: 0,
  pendingVnd: 0,
  lifetimeVnd: 0,
  currency: 'VND',
};

const MOCK_PAYOUTS: Payout[] = [];

interface PayoutListResponse {
  items: Payout[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const payoutsService = {
  async listWallet(): Promise<SellerWallet> {
    if (USE_MOCK) return MOCK_WALLET;
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<SellerWallet>(`${PAYMENT_API}/api/v1/seller/payouts/wallet`, { token });
  },

  async list(params?: { status?: PayoutStatus; page?: number; pageSize?: number }): Promise<PayoutListResponse> {
    if (USE_MOCK) {
      let result = [...MOCK_PAYOUTS];
      if (params?.status) result = result.filter((p) => p.status === params.status);
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const items = result.slice(skip, skip + pageSize);
      return { items, total: result.length, page, pageSize, hasMore: skip + items.length < result.length };
    }
    const token = getToken();
    if (!token) return { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return apiFetch<PayoutListResponse>(
      `${PAYMENT_API}/api/v1/seller/payouts?${query.toString()}`,
      { token }
    );
  },
};
