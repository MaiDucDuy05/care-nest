import { Injectable } from '@nestjs/common';
import { CartRepository, type Cart } from './cart.repository.js';
import type { AddToCartDto, CartItem, UpdateCartItemDto } from './dto/cart-item.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(userId: string): Promise<Cart> {
    return this.cartRepository.findByUser(userId);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<Cart> {
    const item: CartItem = { ...dto };
    return this.cartRepository.addOrIncrement(userId, item);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto): Promise<Cart> {
    return this.cartRepository.updateQuantity(userId, productId, dto.quantity);
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    return this.cartRepository.removeItem(userId, productId);
  }

  async clearCart(userId: string): Promise<void> {
    return this.cartRepository.clear(userId);
  }

  /** Group cart items by seller for split-order checkout. */
  groupBySeller(cart: Cart): Array<{ sellerId: string; items: CartItem[]; subtotal: number }> {
    const groups = new Map<string, { sellerId: string; items: CartItem[]; subtotal: number }>();
    for (const item of cart.items) {
      const group = groups.get(item.sellerId) ?? {
        sellerId: item.sellerId,
        items: [],
        subtotal: 0,
      };
      group.items.push(item);
      group.subtotal += item.unitPrice * item.quantity;
      groups.set(item.sellerId, group);
    }
    return Array.from(groups.values());
  }
}
