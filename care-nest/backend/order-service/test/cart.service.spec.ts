import { describe, it, expect } from 'vitest';
import { CartService } from '../src/cart/cart.service.js';
import type { Cart } from '../src/cart/cart.repository.js';

function fakeRepo(): any {
  const store = new Map<string, Cart>();
  return {
    findByUser: async (userId: string) => store.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() },
    save: async (cart: Cart) => { store.set(cart.userId, cart); return cart; },
    clear: async (userId: string) => { store.delete(userId); },
    addOrIncrement: async (userId: string, item: any) => {
      const cart = store.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() };
      const ex = cart.items.find((i) => i.productId === item.productId);
      if (ex) ex.quantity = Math.min(999, ex.quantity + item.quantity);
      else cart.items.push(item);
      store.set(userId, cart);
      return cart;
    },
    updateQuantity: async (userId: string, productId: string, quantity: number) => {
      const cart = store.get(userId)!;
      const idx = cart.items.findIndex((i) => i.productId === productId);
      if (idx >= 0) {
        if (quantity === 0) cart.items.splice(idx, 1);
        else cart.items[idx].quantity = quantity;
      }
      return cart;
    },
    removeItem: async (userId: string, productId: string) => {
      const cart = store.get(userId)!;
      cart.items = cart.items.filter((i) => i.productId !== productId);
      return cart;
    },
  };
}

describe('CartService', () => {
  it('groups cart items by seller', async () => {
    const repo = fakeRepo();
    const svc = new CartService(repo);
    const userId = 'u1';
    await svc.addItem(userId, { productId: 'p1', sellerId: 's1', name: 'A', unitPrice: 100_000, quantity: 2 });
    await svc.addItem(userId, { productId: 'p2', sellerId: 's1', name: 'B', unitPrice: 50_000, quantity: 1 });
    await svc.addItem(userId, { productId: 'p3', sellerId: 's2', name: 'C', unitPrice: 200_000, quantity: 1 });

    const cart = await svc.getCart(userId);
    const groups = svc.groupBySeller(cart);
    expect(groups).toHaveLength(2);
    const s1 = groups.find((g) => g.sellerId === 's1')!;
    const s2 = groups.find((g) => g.sellerId === 's2')!;
    expect(s1.items).toHaveLength(2);
    expect(s1.subtotal).toBe(100_000 * 2 + 50_000 * 1);
    expect(s2.subtotal).toBe(200_000);
  });

  it('increments quantity on duplicate add', async () => {
    const repo = fakeRepo();
    const svc = new CartService(repo);
    await svc.addItem('u1', { productId: 'p1', sellerId: 's1', name: 'A', unitPrice: 1000, quantity: 1 });
    await svc.addItem('u1', { productId: 'p1', sellerId: 's1', name: 'A', unitPrice: 1000, quantity: 2 });
    const cart = await svc.getCart('u1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  it('removes item when quantity is set to 0', async () => {
    const repo = fakeRepo();
    const svc = new CartService(repo);
    await svc.addItem('u1', { productId: 'p1', sellerId: 's1', name: 'A', unitPrice: 1000, quantity: 2 });
    await svc.updateItem('u1', 'p1', { quantity: 0 });
    const cart = await svc.getCart('u1');
    expect(cart.items).toHaveLength(0);
  });
});
