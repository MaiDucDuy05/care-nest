/**
 * Orders Service — handles querying orders for buyers.
 * Supports fallback to local storage if backend order-service is offline.
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

const LOCAL_ORDERS_KEY = 'buyer_orders';

export function getLocalOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalOrders();
    // Prepend new order, deduplicate by id
    const filtered = existing.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber);
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...filtered]));
  } catch {
    // Ignore quota errors
  }
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
    const localOrders = getLocalOrders();

    if (!token) {
      return { items: localOrders, total: localOrders.length };
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/orders?page=${page}&pageSize=${pageSize}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        return { items: localOrders, total: localOrders.length };
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

      // Gộp cùng các đơn lưu local (nếu có đơn mới tạo offline)
      const combined = [...serverItems];
      for (const loc of localOrders) {
        if (!combined.some((c) => c.id === loc.id || c.orderNumber === loc.orderNumber)) {
          combined.push(loc);
        }
      }

      return {
        items: combined,
        total: Math.max(combined.length, data.total || 0),
      };
    } catch {
      return { items: localOrders, total: localOrders.length };
    }
  },

  /**
   * Lấy chi tiết một đơn hàng theo ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const token = getToken();
    const localOrders = getLocalOrders();
    const foundLocal = localOrders.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!token) {
      return foundLocal || null;
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/orders/${encodeURIComponent(orderId)}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        return foundLocal || null;
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
    } catch {
      return foundLocal || null;
    }
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

