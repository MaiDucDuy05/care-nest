import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, Prisma, type Order, OrderStatus } from '@carenest/database';

function generateOrderNumber(): string {
  // CN-YYYYMMDD-XXXXXX (XXXXXX = 6-char base36 random)
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CN-${ymd}-${rand}`;
}

@Injectable()
export class OrdersRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findById(id: string): Promise<any> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, name: true, requiresImei: true } } } },
        payment: true,
        shipment: true,
      },
    });
  }

  async findByBuyer(buyerId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where: { buyerId, deletedAt: null } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  async findBySeller(sellerId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where: { sellerId, deletedAt: null } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  /**
   * Create a single-seller order with line items atomically.
   * Used by the checkout flow after cart is split by seller.
   */
  async createOrder(params: {
    buyerId: string;
    sellerId: string;
    items: Array<{ productId: string; productName: string; unitPrice: number; quantity: number }>;
    shippingAddress: object;
    shippingFee?: number;
    discount?: number;
    note?: string;
  }): Promise<Order> {
    const subtotal = params.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shippingFee = params.shippingFee ?? 0;
    const discount = params.discount ?? 0;
    const total = subtotal + shippingFee - discount;

    const orderNumber = generateOrderNumber();
    return (await this.prisma.order.create({
      data: {
        orderNumber,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        status: OrderStatus.CREATED,
        subtotal,
        shippingFee,
        discount,
        total,
        shippingAddress: params.shippingAddress as any,
        note: params.note,
        items: {
          create: params.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            lineTotal: i.unitPrice * i.quantity,
          })),
        },
      },
      include: { items: true },
    })) as unknown as Order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return (await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    })) as unknown as Order;
  }
}
