import { SHIPPING_API, apiFetch, getToken } from '../api-client';
import type { Order, OrderStatus } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_ORDERS: Order[] = [
  {
    id: 'o-1001',
    orderNumber: 'CN-202510-0001',
    buyerId: 'buyer-1',
    buyerName: 'Trần Thị B',
    sellerId: 'seller-mock-1',
    status: 'PENDING' as OrderStatus,
    totalVnd: 3380000,
    items: [
      {
        id: 'oi-1',
        productId: 'p-1',
        productName: 'Máy đo huyết áp Omron HEM-7156T',
        quantity: 1,
        priceVnd: 2490000,
        imeis: [],
      },
      {
        id: 'oi-2',
        productId: 'p-2',
        productName: 'Nhiệt kế Microlife MT 550',
        quantity: 1,
        priceVnd: 890000,
        imeis: [],
      },
    ],
    shippingAddress: '12 Nguyễn Văn Cừ, Long Biên, Hà Nội',
    createdAt: '2025-10-15T08:30:00Z',
    updatedAt: '2025-10-15T08:30:00Z',
  },
  {
    id: 'o-1002',
    orderNumber: 'CN-202510-0002',
    buyerId: 'buyer-2',
    buyerName: 'Lê Văn C',
    sellerId: 'seller-mock-1',
    status: 'CONFIRMED' as OrderStatus,
    totalVnd: 2490000,
    items: [
      {
        id: 'oi-3',
        productId: 'p-1',
        productName: 'Máy đo huyết áp Omron HEM-7156T',
        quantity: 1,
        priceVnd: 2490000,
        imeis: [],
      },
    ],
    shippingAddress: '45 Lê Lợi, Quận 1, TP.HCM',
    createdAt: '2025-10-15T09:15:00Z',
    updatedAt: '2025-10-15T09:15:00Z',
  },
];

export interface PackOrderInput {
  orderId: string;
  imeis: Record<string, string[]>; // productId -> imeis
}

export const ordersService = {
  async list(params?: { status?: OrderStatus }): Promise<Order[]> {
    if (USE_MOCK) {
      let result = [...MOCK_ORDERS];
      if (params?.status) result = result.filter((o) => o.status === params.status);
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    return apiFetch<Order[]>(`${SHIPPING_API}/api/v1/seller/orders?${query.toString()}`, { token });
  },

  async getById(id: string): Promise<Order> {
    if (USE_MOCK) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      if (!found) throw new Error('order not found');
      return found;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Order>(`${SHIPPING_API}/api/v1/seller/orders/${id}`, { token });
  },

  async pack(input: PackOrderInput): Promise<Order> {
    if (USE_MOCK) {
      const idx = MOCK_ORDERS.findIndex((o) => o.id === input.orderId);
      if (idx === -1) throw new Error('order not found');
      const items = MOCK_ORDERS[idx].items.map((it) => ({
        ...it,
        imeis: input.imeis[it.productId] ?? [],
      }));
      MOCK_ORDERS[idx] = {
        ...MOCK_ORDERS[idx],
        status: 'PACKING' as OrderStatus,
        items,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_ORDERS[idx];
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Order>(`${SHIPPING_API}/api/v1/seller/orders/${input.orderId}/pack`, {
      method: 'POST',
      body: JSON.stringify(input.imeis),
      token,
    });
  },
};
