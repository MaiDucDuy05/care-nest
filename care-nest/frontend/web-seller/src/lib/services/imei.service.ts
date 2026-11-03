import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { IMEIRecord, IMEIStatus } from '../types';

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
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.productId) query.set('productId', params.productId);
    const res = await apiFetch<ImeiListResponse>(
      `${CATALOG_API}/api/v1/seller/imeis?${query.toString()}`,
      { token }
    );
    return res.items || [];
  },

  /**
   * Bulk-import IMEIs. Server re-validates Luhn + uniqueness; throws
   * an Error containing the server's error message if any IMEI fails.
   */
  async bulkImport(input: { productId: string; imeis: string[] }): Promise<{ imported: number; skipped: number }> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const res = await apiFetch<any>(
      `${CATALOG_API}/api/v1/seller/imeis/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        token,
      }
    );
    const importedCount = Array.isArray(res?.imported) ? res.imported.length : Number(res?.imported || 0);
    const duplicatesCount = Array.isArray(res?.duplicates) ? res.duplicates.length : 0;
    const invalidCount = Array.isArray(res?.invalid) ? res.invalid.length : 0;
    const skippedCount = duplicatesCount + invalidCount || Number(res?.skipped || 0);
    return {
      imported: importedCount,
      skipped: skippedCount,
    };
  },

  /**
   * Allocate IMEIs to an order. Server picks specific IMEIs (the
   * caller passes imeis[] to be reserved).
   */
  async allocate(input: { orderId: string; orderItemId: string; productId: string; imeis: string[] }): Promise<IMEIRecord[]> {
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
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<{ shipped: number }>(`${CATALOG_API}/api/v1/seller/imeis/${orderId}/ship`, {
      method: 'POST',
      token,
    });
  },
};
