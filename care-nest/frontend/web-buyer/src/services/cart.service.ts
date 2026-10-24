/**
 * Cart service — interacts with order-service Cart API (/api/v1/cart).
 * Supports local storage fallback when the user is not yet logged in.
 */
import { ORDER_API, getToken } from '../lib/api-client';

export interface CartItem {
  productId: string;
  sellerId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  userId?: string;
  items: CartItem[];
  updatedAt?: string;
}

export const CART_UPDATED_EVENT = 'carenest:cart-updated';

export function emitCartUpdated(cart?: Cart) {
  if (typeof window === 'undefined') return;
  try {
    const resolvedCart = cart ?? getLocalCart();
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: resolvedCart }));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: resolvedCart }));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore errors
  }
}

const LOCAL_CART_KEY = 'buyer_cart';

function getLocalCart(): Cart {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = window.localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

function saveLocalCart(cart: Cart, notify: boolean = true): Cart {
  if (typeof window === 'undefined') return cart;
  try {
    window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    if (notify) {
      emitCartUpdated(cart);
    }
  } catch {
    // Ignore storage quota errors
  }
  return cart;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const token = getToken();
    if (!token) {
      return getLocalCart();
    }
    try {
      const res = await fetch(`${ORDER_API}/api/v1/cart`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return getLocalCart();
      }
      const data = await res.json();
      saveLocalCart(data);
      return data;
    } catch {
      return getLocalCart();
    }
  },

  async addItem(item: CartItem): Promise<Cart> {
    const token = getToken();
    if (!token) {
      const cart = getLocalCart();
      const existing = cart.items.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }
      return saveLocalCart(cart);
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/cart/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      saveLocalCart(data);
      return data;
    } catch {
      // Fallback to local
      const cart = getLocalCart();
      const existing = cart.items.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }
      return saveLocalCart(cart);
    }
  },

  async updateQuantity(productId: string, quantity: number): Promise<Cart> {
    const token = getToken();
    if (!token) {
      const cart = getLocalCart();
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.productId !== productId);
      } else {
        const item = cart.items.find((i) => i.productId === productId);
        if (item) item.quantity = quantity;
      }
      return saveLocalCart(cart);
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/cart/items/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      saveLocalCart(data);
      return data;
    } catch {
      const cart = getLocalCart();
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.productId !== productId);
      } else {
        const item = cart.items.find((i) => i.productId === productId);
        if (item) item.quantity = quantity;
      }
      return saveLocalCart(cart);
    }
  },

  async removeItem(productId: string): Promise<Cart> {
    const token = getToken();
    if (!token) {
      const cart = getLocalCart();
      cart.items = cart.items.filter((i) => i.productId !== productId);
      return saveLocalCart(cart);
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/cart/items/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      saveLocalCart(data);
      return data;
    } catch {
      const cart = getLocalCart();
      cart.items = cart.items.filter((i) => i.productId !== productId);
      return saveLocalCart(cart);
    }
  },

  async clearCart(): Promise<void> {
    const token = getToken();
    saveLocalCart({ items: [] });
    if (token) {
      try {
        await fetch(`${ORDER_API}/api/v1/cart`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch {
        // ignore
      }
    }
  },

  async checkout(payload: {
    items?: Array<{ productId: string; quantity: number; unitPrice: number; sellerId: string; name?: string }>;
    shippingAddress: {
      name?: string;
      fullName?: string;
      phone: string;
      line1?: string;
      addressLine?: string;
      ward?: string;
      district?: string;
      province?: string;
      city?: string;
      country?: string;
    };
    paymentMethod: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'COD' | 'BANK_TRANSFER';
    note?: string;
    voucherCode?: string;
  }) {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiến hành đặt hàng');

    const addr = payload.shippingAddress;
    const normalizedShippingAddress = {
      name: (addr.name || addr.fullName || '').trim(),
      phone: (addr.phone || '').trim(),
      line1: (addr.line1 || addr.addressLine || '').trim(),
      ward: (addr.ward || '').trim() || undefined,
      district: (addr.district || 'Quận 1').trim(),
      province: (addr.province || addr.city || 'Hồ Chí Minh').trim(),
      country: addr.country || 'VN',
    };

    const checkoutBody = {
      shippingAddress: normalizedShippingAddress,
      paymentMethod: payload.paymentMethod,
      ...(payload.note ? { note: payload.note.trim() } : {}),
      ...(payload.voucherCode ? { voucherCode: payload.voucherCode.trim() } : {}),
    };

    // Đảm bảo các sản phẩm từ client được đồng bộ vào Redis cart của backend trước khi checkout
    if (payload.items && payload.items.length > 0) {
      for (const it of payload.items) {
        try {
          await fetch(`${ORDER_API}/api/v1/cart/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              productId: it.productId,
              quantity: it.quantity,
              sellerId: it.sellerId || 'system-store',
              name: it.name || 'Thiết bị y tế',
              unitPrice: it.unitPrice,
            }),
          });
        } catch {
          // ignore sync failure
        }
      }
    }

    try {
      const res = await fetch(`${ORDER_API}/api/v1/orders/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkoutBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      await this.clearCart();
      return res.json();
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || '';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('ECONNREFUSED')) {
        throw new Error('Không thể kết nối đến máy chủ đặt hàng (order-service:3004). Vui lòng đảm bảo backend order-service đang chạy.');
      }
      throw err;
    }
  },
};
