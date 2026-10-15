import { Injectable, NotFoundException } from '@nestjs/common';
import { cacheGet, cacheSet, cacheDel } from '@carenest/shared-redis';
import type { CartItem } from './dto/cart-item.dto.js';

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CART_KEY = (userId: string) => `cart:${userId}`;

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

@Injectable()
export class CartRepository {
  async findByUser(userId: string): Promise<Cart> {
    const key = CART_KEY(userId);
    try {
      const cached = await cacheGet<Cart>(key);
      if (cached) return cached;
    } catch {
      // Redis offline — return empty cart
    }
    return { userId, items: [], updatedAt: new Date().toISOString() };
  }

  async save(cart: Cart): Promise<Cart> {
    const key = CART_KEY(cart.userId);
    const next = { ...cart, updatedAt: new Date().toISOString() };
    try {
      await cacheSet(key, next, { ttlSeconds: CART_TTL_SECONDS });
    } catch {
      // best-effort; tolerate Redis blips
    }
    return next;
  }

  async clear(userId: string): Promise<void> {
    try {
      await cacheDel(CART_KEY(userId));
    } catch {
      // best-effort
    }
  }

  async addOrIncrement(userId: string, item: CartItem): Promise<Cart> {
    const cart = await this.findByUser(userId);
    const existing = cart.items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + item.quantity);
    } else {
      cart.items.push(item);
    }
    return this.save(cart);
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.findByUser(userId);
    const idx = cart.items.findIndex((i) => i.productId === productId);
    if (idx === -1) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ${productId} trong giỏ hàng`);
    }
    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    return this.save(cart);
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.findByUser(userId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.save(cart);
  }
}
