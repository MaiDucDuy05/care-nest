import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient, type Inventory } from '@carenest/database';

const HOLD_TTL_MINUTES = 10;

@Injectable()
export class InventoryRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Atomically reserve `quantity` units of a product.
   * Pessimistic-locked via Prisma `update` with `quantity - reserved >= quantity` guard.
   * Throws on insufficient stock.
   */
  async reserve(productId: string, quantity: number): Promise<Inventory> {
    if (quantity <= 0) throw new Error('Quantity must be positive');

    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findFirst({
        where: { productId, quantity: { gte: 0 } },
        orderBy: { updatedAt: 'desc' },
      });
      if (!inv) throw new Error(`No inventory row for product ${productId}`);
      if (inv.quantity - inv.reserved < quantity) {
        throw new Error(`Insufficient stock for product ${productId} (have ${inv.quantity - inv.reserved}, need ${quantity})`);
      }
      return tx.inventory.update({
        where: { id: inv.id },
        data: { reserved: { increment: quantity } },
      });
    });
  }

  /** Release a previously held reservation (e.g. on cart expiry, order cancel). */
  async release(productId: string, quantity: number): Promise<Inventory> {
    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findFirst({
        where: { productId },
        orderBy: { updatedAt: 'desc' },
      });
      if (!inv) throw new Error(`No inventory row for product ${productId}`);
      const releaseQty = Math.min(quantity, inv.reserved);
      return tx.inventory.update({
        where: { id: inv.id },
        data: { reserved: { decrement: releaseQty } },
      });
    });
  }

  /** Confirm a hold by actually decrementing the available quantity. */
  async commit(productId: string, quantity: number): Promise<Inventory> {
    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findFirst({
        where: { productId },
        orderBy: { updatedAt: 'desc' },
      });
      if (!inv) throw new Error(`No inventory row for product ${productId}`);
      return tx.inventory.update({
        where: { id: inv.id },
        data: {
          quantity: { decrement: quantity },
          reserved: { decrement: quantity },
        },
      });
    });
  }

  async getHoldTtlSeconds(): Promise<number> {
    return HOLD_TTL_MINUTES * 60;
  }
}
