import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@carenest/database';
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

    assertTransition(order.status, dto.status);

    const updated = await this.ordersRepository.updateStatus(orderId, dto.status);

    // On cancel: release held stock
    if (dto.status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        try { await this.inventoryService.release(item.productId, item.quantity); } catch { /* swallow */ }
      }
    }

    // On shipped: commit stock
    if (dto.status === OrderStatus.SHIPPED) {
      for (const item of order.items) {
        try { await this.inventoryService.commit(item.productId, item.quantity); } catch { /* swallow */ }
      }
    }

    // Publish event
    try {
      if (dto.status === OrderStatus.SHIPPED) {
        await this.eventPublisher.publishOrderShipped({ orderId: updated.id, orderNumber: updated.orderNumber, buyerId: updated.buyerId });
      }
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish status event');
    }

    return updated;
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
}
