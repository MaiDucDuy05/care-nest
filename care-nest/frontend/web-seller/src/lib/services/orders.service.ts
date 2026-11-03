import { ORDER_API, apiFetch, getToken } from '../api-client';
import type { Order, OrderStatus } from '../types';

interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const ordersService = {
  /**
   * The order service resolves a seller's profile from the authenticated
   * user, so seller pages can list orders without sending a sellerId.
   */
  async list(sellerId?: string, params?: { status?: OrderStatus }): Promise<Order[]> {
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (sellerId) query.set('sellerId', sellerId);
    if (params?.status) query.set('status', params.status);
    const res = await apiFetch<OrderListResponse>(
      `${ORDER_API}/api/v1/orders?${query.toString()}`,
      { token }
    );
    return res.items || [];
  },

  async getById(id: string): Promise<Order> {
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
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Order>(`${ORDER_API}/api/v1/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
      token,
    });
  },
};
