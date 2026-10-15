import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { IMEIRecord, IMEIStatus } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

let MOCK_IMEIS: IMEIRecord[] = [
  { id: 'i-1', imei: '352099001761481', productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', status: 'IN_STOCK' as IMEIStatus, assignedOrderId: null, createdAt: '2025-10-15T10:00:00Z' },
  { id: 'i-2', imei: '352099001761482', productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', status: 'IN_STOCK' as IMEIStatus, assignedOrderId: null, createdAt: '2025-10-15T10:00:00Z' },
  { id: 'i-3', imei: '352099001761483', productId: 'p-1', productName: 'Máy đo huyết áp Omron HEM-7156T', status: 'RESERVED' as IMEIStatus, assignedOrderId: 'o-1001', createdAt: '2025-10-15T10:00:00Z' },
];

export const inventoryService = {
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
    return apiFetch<IMEIRecord[]>(`${CATALOG_API}/api/v1/seller/imeis?${query.toString()}`, { token });
  },

  async add(imei: string, productId: string): Promise<IMEIRecord> {
    if (USE_MOCK) {
      const created: IMEIRecord = {
        id: 'i-' + Date.now(),
        imei,
        productId,
        status: 'IN_STOCK' as IMEIStatus,
        assignedOrderId: null,
        createdAt: new Date().toISOString(),
      };
      MOCK_IMEIS = [created, ...MOCK_IMEIS];
      return created;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<IMEIRecord>(`${CATALOG_API}/api/v1/seller/imeis`, {
      method: 'POST',
      body: JSON.stringify({ imei, productId }),
      token,
    });
  },

  async assign(imeiIds: string[], orderId: string): Promise<IMEIRecord[]> {
    if (USE_MOCK) {
      const updated: IMEIRecord[] = [];
      MOCK_IMEIS = MOCK_IMEIS.map((r) => {
        if (imeiIds.includes(r.id)) {
          const next = { ...r, status: 'RESERVED' as IMEIStatus, assignedOrderId: orderId };
          updated.push(next);
          return next;
        }
        return r;
      });
      return updated;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<IMEIRecord[]>(`${CATALOG_API}/api/v1/seller/imeis/assign`, {
      method: 'POST',
      body: JSON.stringify({ imeiIds, orderId }),
      token,
    });
  },
};
