import { ORDER_API, apiFetch, getToken } from '../api-client';
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
];

interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const ordersService = {
  /**
   * List orders for the current seller. Pass the sellerId (the User
   * id mapped to the seller record) so order-service filters by it.
   * If no sellerId is given, returns the buyer's own orders — useful
   * for pages that don't yet have the seller context loaded.
   */
  async list(sellerId?: string, params?: { status?: OrderStatus }): Promise<Order[]> {
    if (USE_MOCK) {
      let result = [...MOCK_ORDERS];
      if (params?.status) result = result.filter((o) => o.status === params.status);
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (sellerId) query.set('sellerId', sellerId);
    if (params?.status) query.set('status', params.status);
    const res = await apiFetch<OrderListResponse>(
      `${ORDER_API}/api/v1/orders?${query.toString()}`,
      { token }
    );
    return res.items;
  },

  async getById(id: string): Promise<Order> {
    if (USE_MOCK) {
      const found = MOCK_ORDERS.find((o) => o.id === id);
      if (!found) throw new Error('order not found');
      return found;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Order>(`${ORDER_API}/api/v1/orders/${id}`, { token });
  },

  /**
   * Move an order to a new status. For SHIPPED, the seller must
   * first allocate IMEIs (via imeiService.allocate) and the server
   * will run the assertImeisReady guard.
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (USE_MOCK) {
      const idx = MOCK_ORDERS.findIndex((o) => o.id === orderId);
      if (idx === -1) throw new Error('order not found');
      MOCK_ORDERS[idx] = {
        ...MOCK_ORDERS[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_ORDERS[idx];
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Order>(`${ORDER_API}/api/v1/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
      token,
    });
  },
};
