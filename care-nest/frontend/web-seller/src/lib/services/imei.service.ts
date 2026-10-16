import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { IMEIRecord, IMEIStatus } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

let MOCK_IMEIS: IMEIRecord[] = [
  { id: 'i-1', imei: '352099001761488', productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', status: 'IN_STOCK' as IMEIStatus, orderId: null, orderItemId: null, createdAt: '2025-10-15T10:00:00Z' },
  { id: 'i-2', imei: '490154203237518', productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', status: 'IN_STOCK' as IMEIStatus, orderId: null, orderItemId: null, createdAt: '2025-10-15T10:00:00Z' },
];

/**
 * Luhn-15 client-side validation. Re-validated server-side; this is
 * just to give the seller faster feedback when typing/pasting IMEIs.
 */
export function isValidImei(raw: string): boolean {
  if (!/^\d{15}$/.test(raw)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const d = Number(raw[i]);
    if (Number.isNaN(d)) return false;
    // Position from the right: 15 - i. Even positions (from right, 1-indexed) get doubled.
    const fromRight = 15 - i;
    let v = d;
    if (fromRight % 2 === 0) {
      v = d * 2;
      if (v > 9) v -= 9;
    }
    sum += v;
  }
  return sum % 10 === 0;
}

interface ImeiListResponse {
  items: IMEIRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const imeiService = {
  async list(params?: { status?: IMEIStatus; productId?: string }): Promise<IMEIRecord[]> {
    if (USE_MOCK) {
      let result = [...MOCK_IMEIS];
      if (params?.status) result = result.filter((r) => r.status === params.status);
      if (params?.productId) result = result.filter((r) => r.productId === params.productId);
      return result;
    }
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.productId) query.set('productId', params.productId);
    const res = await apiFetch<ImeiListResponse>(
      `${CATALOG_API}/api/v1/seller/imeis?${query.toString()}`,
      { token }
    );
    return res.items;
  },

  /**
   * Bulk-import IMEIs. Server re-validates Luhn + uniqueness; throws
   * an Error containing the server's error message if any IMEI fails.
   */
  async bulkImport(input: { productId: string; imeis: string[] }): Promise<{ imported: number; skipped: number }> {
    if (USE_MOCK) {
      let imported = 0;
      let skipped = 0;
      for (const imei of input.imeis) {
        if (!isValidImei(imei)) {
          skipped++;
          continue;
        }
        if (MOCK_IMEIS.find((r) => r.imei === imei)) {
          skipped++;
          continue;
        }
        MOCK_IMEIS = [
          {
            id: 'i-' + Date.now() + '-' + imported,
            imei,
            productId: input.productId,
            status: 'IN_STOCK' as IMEIStatus,
            orderId: null,
            orderItemId: null,
            createdAt: new Date().toISOString(),
          },
          ...MOCK_IMEIS,
        ];
        imported++;
      }
      return { imported, skipped };
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<{ imported: number; skipped: number }>(
      `${CATALOG_API}/api/v1/seller/imeis/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        token,
      }
    );
  },

  /**
   * Allocate IMEIs to an order. Server picks specific IMEIs (the
   * caller passes imeis[] to be reserved).
   */
  async allocate(input: { orderId: string; orderItemId: string; productId: string; imeis: string[] }): Promise<IMEIRecord[]> {
    if (USE_MOCK) {
      const out: IMEIRecord[] = [];
      MOCK_IMEIS = MOCK_IMEIS.map((r) => {
        if (input.imeis.includes(r.imei) && r.status === 'IN_STOCK') {
          const next: IMEIRecord = {
            ...r,
            status: 'RESERVED' as IMEIStatus,
            orderId: input.orderId,
            orderItemId: input.orderItemId,
          };
          out.push(next);
          return next;
        }
        return r;
      });
      return out;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<IMEIRecord[]>(`${CATALOG_API}/api/v1/seller/imeis/allocate`, {
      method: 'POST',
      body: JSON.stringify(input),
      token,
    });
  },

  /**
   * Release reserved IMEIs back to IN_STOCK (e.g. on order cancellation).
   */
  async release(input: { orderId: string; imeis: string[] }): Promise<{ released: number }> {
    if (USE_MOCK) {
      let released = 0;
      MOCK_IMEIS = MOCK_IMEIS.map((r) => {
        if (input.imeis.includes(r.imei) && r.status === 'RESERVED' && r.orderId === input.orderId) {
          released++;
          return { ...r, status: 'IN_STOCK' as IMEIStatus, orderId: null, orderItemId: null };
        }
        return r;
      });
      return { released };
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<{ released: number }>(`${CATALOG_API}/api/v1/seller/imeis/release`, {
      method: 'POST',
      body: JSON.stringify(input),
      token,
    });
  },

  /**
   * Mark all RESERVED IMEIs for an order as SHIPPED.
   * Call this when transitioning the order to SHIPPED status.
   */
  async markOrderShipped(orderId: string): Promise<{ shipped: number }> {
    if (USE_MOCK) {
      let shipped = 0;
      MOCK_IMEIS = MOCK_IMEIS.map((r) => {
        if (r.orderId === orderId && r.status === 'RESERVED') {
          shipped++;
          return { ...r, status: 'SHIPPED' as IMEIStatus };
        }
        return r;
      });
      return { shipped };
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<{ shipped: number }>(`${CATALOG_API}/api/v1/seller/imeis/${orderId}/ship`, {
      method: 'POST',
      token,
    });
  },
};
