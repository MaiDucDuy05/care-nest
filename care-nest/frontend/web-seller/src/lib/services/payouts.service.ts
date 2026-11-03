import { PAYMENT_API, apiFetch, getToken } from '../api-client';
import type { Payout, PayoutStatus, SellerWallet, WalletEntry, WalletEntryKind } from '../types';

interface PayoutListResponse {
  items: Payout[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface EntriesListResponse {
  items: WalletEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const payoutsService = {
  async listWallet(): Promise<SellerWallet> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<SellerWallet>(`${PAYMENT_API}/api/v1/seller/payouts/wallet`, { token });
  },

  async list(params?: { status?: PayoutStatus; page?: number; pageSize?: number }): Promise<PayoutListResponse> {
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

  async listEntries(params?: { kind?: WalletEntryKind; page?: number; pageSize?: number }): Promise<EntriesListResponse> {
    const token = getToken();
    if (!token) return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    const query = new URLSearchParams();
    if (params?.kind) query.set('kind', params.kind);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return apiFetch<EntriesListResponse>(
      `${PAYMENT_API}/api/v1/seller/payouts/entries?${query.toString()}`,
      { token }
    );
  },
};
