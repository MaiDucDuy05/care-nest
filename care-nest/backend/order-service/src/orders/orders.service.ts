import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, ImeiStatus, getPrismaClient } from '@carenest/database';
import { OrdersRepository } from './orders.repository.js';
import { CartService } from '../cart/cart.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { assertTransition } from '../state-machine/order-state.js';
import { OrderEventPublisher } from '../kafka/order-event.publisher.js';
import type { CheckoutDto, UpdateOrderStatusDto } from './dto/order.dto.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly eventPublisher: OrderEventPublisher,
  ) {}

  async checkout(buyerId: string, dto: CheckoutDto) {
    const cart = await this.cartService.getCart(buyerId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const groups = this.cartService.groupBySeller(cart);
    const createdOrders: any[] = [];

    for (const group of groups) {
      // 1. Hold stock for each item (10 min TTL)
      for (const item of group.items) {
        try {
          await this.inventoryService.hold(item.productId, item.quantity);
        } catch (err: any) {
          this.logger.warn({ productId: item.productId, err: err.message }, 'Inventory hold failed — releasing others');
          // rollback holds placed so far in this checkout
          for (const placed of createdOrders) {
            for (const i of placed.items) {
              try { await this.inventoryService.release(i.productId, i.quantity); } catch { /* swallow */ }
            }
          }
          throw new BadRequestException(`Sản phẩm ${item.name} không đủ hàng`);
        }
      }

      // 2. Create the per-seller order
      const order = await this.ordersRepository.createOrder({
        buyerId,
        sellerId: group.sellerId,
        items: group.items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        shippingAddress: dto.shippingAddress,
        note: dto.note,
      });

      createdOrders.push(order);

      // 3. Publish ORDER_CREATED event (best-effort)
      try {
        await this.eventPublisher.publishOrderCreated({
          orderId: order.id,
          orderNumber: order.orderNumber,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          total: Number(order.total),
          paymentMethod: dto.paymentMethod,
        });
      } catch (err: any) {
        this.logger.warn({ err: err.message }, 'Failed to publish ORDER_CREATED — continuing');
      }
    }

    // 4. Clear cart on full success
    await this.cartService.clearCart(buyerId);

    return { orders: createdOrders };
  }

  async getOrder(userId: string, orderId: string, isAdmin = false): Promise<any> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng ${orderId}`);
    if (!isAdmin && order.buyerId !== userId) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ${orderId}`);
    }
    return order;
  }

  async listForBuyer(buyerId: string, page = 1, pageSize = 20): Promise<any> {
    return this.ordersRepository.findByBuyer(buyerId, page, pageSize);
  }

  async listForSeller(sellerId: string, page = 1, pageSize = 20): Promise<any> {
    return this.ordersRepository.findBySeller(sellerId, page, pageSize);
  }

  /**
   * Transition an order to a new status with state-machine guard.
   * Publishes the corresponding Kafka event on success.
   */
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<any> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng ${orderId}`);

    if (order.status === dto.status) {
      return order;
    }

    // Support direct delivery confirmation if order is in progress
    if (
      dto.status === OrderStatus.DELIVERED &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.RETURNED
    ) {
      return this.ordersRepository.updateStatus(orderId, OrderStatus.DELIVERED);
    }

    assertTransition(order.status, dto.status);

    // S12 IMEI guard: SHIPPED requires every IMEI-required item to have
    // its allocated IMEIs present and reserved.
    if (dto.status === OrderStatus.SHIPPED) {
      await this.assertImeisReady(orderId, order.items);
    }

    const updated = await this.ordersRepository.updateStatus(orderId, dto.status);

    // On cancel: release held stock
    if (dto.status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        try { await this.inventoryService.release(item.productId, item.quantity); } catch { /* swallow */ }
      }
    }

    // On shipped: commit stock + mark IMEIs SHIPPED
    if (dto.status === OrderStatus.SHIPPED) {
      for (const item of order.items) {
        try { await this.inventoryService.commit(item.productId, item.quantity); } catch { /* swallow */ }
      }
      // Mark IMEIs as SHIPPED via the catalog-service. Best-effort: if
      // this fails, the order still ships (the next allocation cycle will
      // resync), but we log the failure.
      try {
        const prisma = getPrismaClient();
        await prisma.imeiRecord.updateMany({
          where: { orderId, status: ImeiStatus.RESERVED },
          data: { status: ImeiStatus.SHIPPED },
        });
      } catch (err: any) {
        this.logger.warn({ orderId, err: err.message }, 'Failed to mark IMEIs SHIPPED — continuing');
      }
    }

    // Publish event
    try {
      if (dto.status === OrderStatus.SHIPPED) {
        // S12: include IMEI list in the event for downstream consumers
        const imeis = await this.loadShippedImeis(orderId);
        await this.eventPublisher.publishOrderShipped({
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          buyerId: updated.buyerId,
          sellerId: updated.sellerId,
          imeis: imeis.map((i) => ({
            imei: i.imei,
            productId: i.productId,
            orderItemId: i.orderItemId ?? '',
          })),
        });
      }
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish status event');
    }

    return updated;
  }

  /**
   * Mark an order as DELIVERED (e.g. buyer confirms receipt or admin updates).
   */
  async markAsDelivered(userId: string, orderId: string, isAdmin = false): Promise<any> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng ${orderId}`);
    if (!isAdmin && order.buyerId !== userId && order.sellerId !== userId) {
      throw new NotFoundException(`Không tìm thấy đơn hàng ${orderId}`);
    }
    if (order.status === OrderStatus.DELIVERED) {
      return order;
    }
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) {
      throw new BadRequestException('Không thể xác nhận giao hàng cho đơn đã hủy hoặc hoàn trả');
    }
    return this.ordersRepository.updateStatus(orderId, OrderStatus.DELIVERED);
  }

  /**
   * S12: for every order item whose product requires IMEI, verify that
   * the required number of IMEIs have been RESERVED for the order.
   * Throws BadRequestException with a per-item breakdown if not.
   */
  private async assertImeisReady(
    orderId: string,
    items: Array<{ id: string; productId: string; quantity: number; product?: { requiresImei?: boolean; name: string } }>
  ): Promise<void> {
    const prisma = getPrismaClient();
    const reserved = await prisma.imeiRecord.findMany({
      where: { orderId, status: ImeiStatus.RESERVED },
      select: { orderItemId: true, imei: true, productId: true },
    });
    const countsByItem = new Map<string, number>();
    for (const r of reserved) {
      if (!r.orderItemId) continue;
      countsByItem.set(r.orderItemId, (countsByItem.get(r.orderItemId) ?? 0) + 1);
    }
    const missing: string[] = [];
    for (const item of items) {
      if (!item.product?.requiresImei) continue;
      const have = countsByItem.get(item.id) ?? 0;
      if (have < item.quantity) {
        missing.push(`${item.product.name}: ${have}/${item.quantity} IMEI`);
      }
    }
    if (missing.length > 0) {
      throw new BadRequestException(
        `Không thể SHIPPED — thiếu IMEI: ${missing.join('; ')}`
      );
    }
  }

  private async loadShippedImeis(orderId: string) {
    const prisma = getPrismaClient();
    return prisma.imeiRecord.findMany({
      where: { orderId, status: ImeiStatus.SHIPPED },
      select: { imei: true, productId: true, orderItemId: true },
    });
  }

  /**
   * Called by Kafka consumer when a payment is confirmed.
   * Moves order CREATED → CONFIRMED.
   */
  async confirmPaid(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      this.logger.warn({ orderId }, 'confirmPaid: order not found');
      return null;
    }
    if (order.status !== OrderStatus.CREATED) {
      this.logger.warn({ orderId, status: order.status }, 'confirmPaid: order not in CREATED — skipping');
      return order;
    }
    return this.ordersRepository.updateStatus(orderId, OrderStatus.CONFIRMED);
  }

  async listAdmin(page = 1, limit = 50, filters: any = {}): Promise<any> {
    const prisma = getPrismaClient();
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          seller: { select: { storeName: true } },
          buyer: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const data = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id.slice(0, 8),
      buyerName: o.buyer?.fullName || 'Khách hàng CareNest',
      buyerEmail: o.buyer?.email || '',
      sellerName: o.seller?.storeName || 'Nhà bán hàng CareNest',
      totalVnd: Number(o.total || 0),
      status: o.status,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
