/**
 * Orders Service — handles querying orders for buyers directly from order-service API.
 */
import { ORDER_API, getToken } from '../lib/api-client';

export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PACKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  lineTotal?: number;
  imageUrl?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  ward?: string;
  district: string;
  province: string;
  country?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId?: string;
  sellerId?: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod?: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const ordersService = {
  /**
   * Lấy danh sách đơn hàng của người mua
   */
  async listOrders(page = 1, pageSize = 20): Promise<{ items: Order[]; total: number }> {
    const token = getToken();
    if (!token) {
      return { items: [], total: 0 };
    }

    const res = await fetch(`${ORDER_API}/api/v1/orders?page=${page}&pageSize=${pageSize}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load orders: HTTP ${res.status}`);
    }

    const data = await res.json();
    const serverItems: Order[] = (data.items || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      buyerId: o.buyerId,
      sellerId: o.sellerId,
      status: o.status || 'CREATED',
      subtotal: Number(o.subtotal || 0),
      shippingFee: Number(o.shippingFee || 0),
      discount: Number(o.discount || 0),
      total: Number(o.total || 0),
      shippingAddress: o.shippingAddress || {},
      paymentMethod: o.payment?.method || o.paymentMethod || 'COD',
      note: o.note,
      createdAt: o.createdAt || new Date().toISOString(),
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName || i.name || 'Thiết bị y tế',
        name: i.productName || i.name || 'Thiết bị y tế',
        unitPrice: Number(i.unitPrice || 0),
        quantity: Number(i.quantity || 1),
        lineTotal: Number(i.lineTotal || (i.unitPrice * i.quantity) || 0),
        imageUrl: i.imageUrl,
      })),
    }));

    return {
      items: serverItems,
      total: Number(data.total || serverItems.length),
    };
  },

  /**
   * Lấy chi tiết một đơn hàng theo ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const token = getToken();
    if (!token) return null;

    const res = await fetch(`${ORDER_API}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to load order: HTTP ${res.status}`);
    }

    const o = await res.json();
    return {
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      buyerId: o.buyerId,
      sellerId: o.sellerId,
      status: o.status || 'CREATED',
      subtotal: Number(o.subtotal || 0),
      shippingFee: Number(o.shippingFee || 0),
      discount: Number(o.discount || 0),
      total: Number(o.total || 0),
      shippingAddress: o.shippingAddress || {},
      paymentMethod: o.payment?.method || o.paymentMethod || 'COD',
      note: o.note,
      createdAt: o.createdAt || new Date().toISOString(),
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName || i.name || 'Thiết bị y tế',
        name: i.productName || i.name || 'Thiết bị y tế',
        unitPrice: Number(i.unitPrice || 0),
        quantity: Number(i.quantity || 1),
        lineTotal: Number(i.lineTotal || (i.unitPrice * i.quantity) || 0),
        imageUrl: i.imageUrl,
      })),
    };
  },

  /**
   * Người mua xác nhận đã nhận hàng
   */
  async confirmDelivery(orderId: string): Promise<Order | null> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để xác nhận giao hàng');

    const res = await fetch(`${ORDER_API}/api/v1/orders/${encodeURIComponent(orderId)}/deliver`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể xác nhận giao hàng trên máy chủ');
    }

    return this.getOrder(orderId);
  },

  /**
   * Chuyển đổi mã trạng thái sang tiếng Việt và màu sắc hiển thị
   */
  getStatusMeta(status: OrderStatus): { label: string; color: string; bg: string; step: number } {
    switch (status) {
      case 'CREATED':
        return { label: 'Chờ xác nhận', color: '#b45309', bg: '#fef3c7', step: 1 };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', color: '#0369a1', bg: '#e0f2fe', step: 2 };
      case 'PACKING':
        return { label: 'Đang đóng gói', color: '#4338ca', bg: '#e0e7ff', step: 2 };
      case 'SHIPPED':
        return { label: 'Đang giao hàng', color: '#0284c7', bg: '#e0f2fe', step: 3 };
      case 'DELIVERED':
        return { label: 'Đã giao thành công', color: '#047857', bg: '#d1fae5', step: 4 };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: '#be123c', bg: '#ffe4e6', step: 0 };
      case 'RETURNED':
        return { label: 'Trả hàng / Hoàn tiền', color: '#6b7280', bg: '#f3f4f6', step: 0 };
      default:
        return { label: 'Đang xử lý', color: '#0d9488', bg: '#ccfbf1', step: 1 };
    }
  },
};
