import { PAYMENT_API, apiFetch, getToken } from '../api-client';
import type { Payout, PayoutStatus, SellerWallet, WalletEntry, WalletEntryKind } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_WALLET: SellerWallet = {
  balanceVnd: 12_350_000,
  pendingVnd: 2_100_000,
  lifetimeVnd: 48_200_000,
  currency: 'VND',
};

const MOCK_PAYOUTS: Payout[] = [
  {
    id: 'po-1',
    sellerId: 's-1',
    amountVnd: 3_500_000,
    status: 'PAID',
    bankName: 'VCB',
    bankAccount: '****1234',
    bankAccountName: 'NGUYEN VAN A',
    transferRef: 'STUB-1700000000-po-1',
    requestedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    processedAt: new Date(Date.now() - 14 * 86_400_000 + 3600_000).toISOString(),
    paidAt: new Date(Date.now() - 14 * 86_400_000 + 3600_000).toISOString(),
  },
  {
    id: 'po-2',
    sellerId: 's-1',
    amountVnd: 1_200_000,
    status: 'PENDING',
    bankName: 'VCB',
    bankAccount: '****1234',
    bankAccountName: 'NGUYEN VAN A',
    requestedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];

const MOCK_ENTRIES: WalletEntry[] = [
  {
    id: 'we-1',
    kind: 'ORDER_CREDIT',
    amountVnd: 1_500_000,
    balanceAfterVnd: 1_500_000,
    referenceType: 'order',
    referenceId: 'o-1001',
    description: 'Order ORD-1001 credit',
    createdAt: new Date(Date.now() - 21 * 86_400_000).toISOString(),
  },
  {
    id: 'we-2',
    kind: 'COMMISSION_DEBIT',
    amountVnd: -150_000,
    balanceAfterVnd: 1_350_000,
    referenceType: 'order',
    referenceId: 'o-1001',
    description: 'Commission @ 0.10 for ORD-1001',
    createdAt: new Date(Date.now() - 21 * 86_400_000 + 1000).toISOString(),
  },
  {
    id: 'we-3',
    kind: 'PAYOUT_DEBIT',
    amountVnd: -1_350_000,
    balanceAfterVnd: 0,
    referenceType: 'payout',
    referenceId: 'po-1',
    description: 'Payout transfer STUB-1700000000-po-1',
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  },
  {
    id: 'we-4',
    kind: 'ORDER_CREDIT',
    amountVnd: 2_500_000,
    balanceAfterVnd: 2_500_000,
    referenceType: 'order',
    referenceId: 'o-1002',
    description: 'Order ORD-1002 credit',
    createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  },
  {
    id: 'we-5',
    kind: 'COMMISSION_DEBIT',
    amountVnd: -250_000,
    balanceAfterVnd: 2_250_000,
    referenceType: 'order',
    referenceId: 'o-1002',
    description: 'Commission @ 0.10 for ORD-1002',
    createdAt: new Date(Date.now() - 10 * 86_400_000 + 1000).toISOString(),
  },
  {
    id: 'we-6',
    kind: 'REFUND_DEBIT',
    amountVnd: -2_500_000,
    balanceAfterVnd: -250_000,
    referenceType: 'order',
    referenceId: 'o-1002',
    description: 'Buyer requested refund for ORD-1002',
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
];

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

  async listEntries(params?: { kind?: WalletEntryKind; page?: number; pageSize?: number }): Promise<EntriesListResponse> {
    if (USE_MOCK) {
      let result = [...MOCK_ENTRIES];
      if (params?.kind) result = result.filter((e) => e.kind === params.kind);
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 50;
      const skip = (page - 1) * pageSize;
      const items = result.slice(skip, skip + pageSize);
      return { items, total: result.length, page, pageSize, hasMore: skip + items.length < result.length };
    }
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
