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

function saveLocalCart(cart: Cart): Cart {
  if (typeof window === 'undefined') return cart;
  try {
    window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
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
    items: Array<{ productId: string; quantity: number; unitPrice: number; sellerId: string }>;
    shippingAddress: { fullName: string; phone: string; addressLine: string; city: string; district?: string };
    paymentMethod: 'VNPAY' | 'MOMO' | 'COD' | 'BANK_TRANSFER';
  }) {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiến hành đặt hàng');

    const res = await fetch(`${ORDER_API}/api/v1/orders/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    await this.clearCart();
    return res.json();
  },
};
