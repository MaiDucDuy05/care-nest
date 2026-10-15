import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShippingProviderFactory } from '../providers/shipping-provider.factory.js';
import { ShippingEventPublisher } from '../kafka/shipping-event.publisher.js';
import { type CarrierCode, type ShipmentStatus } from '../providers/shipping-provider.interface.js';
import type { QuoteFeeDto, CreateShipmentDto } from './dto/shipments.dto.js';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly factory: ShippingProviderFactory,
    private readonly events: ShippingEventPublisher,
  ) {}

  /**
   * Quote a shipping fee for the given route + package. Optionally request
   * a specific carrier; otherwise the factory's default is used.
   */
  async quoteFee(dto: QuoteFeeDto) {
    const carrier = (dto.carrier as CarrierCode) ?? this.factory.getDefault()?.carrierCode;
    if (!carrier) {
      throw new BadRequestException('Không có carrier nào được cấu hình');
    }
    const provider = this.factory.get(carrier);
    return provider.calculateFee({
      fromAddress: dto.fromAddress,
      toAddress: dto.toAddress,
      package: dto.package,
      serviceCode: dto.serviceCode,
    });
  }

  /**
   * Quote fees from BOTH carriers and return the cheaper one. Useful at
   * checkout when the buyer hasn't picked a provider.
   */
  async quoteCheapest(dto: QuoteFeeDto) {
    const quotes = await Promise.all(
      this.factory.list().map((c) =>
        this.factory.get(c).calculateFee({
          fromAddress: dto.fromAddress,
          toAddress: dto.toAddress,
          package: dto.package,
          serviceCode: dto.serviceCode,
        }),
      ),
    );
    quotes.sort((a, b) => a.totalFee - b.totalFee);
    return quotes[0] ?? null;
  }

  /**
   * Hand an order to a carrier and persist the resulting tracking code.
   * If the order already has a shipment, the existing one is returned
   * (idempotency by UNIQUE orderId constraint).
   */
  async create(dto: CreateShipmentDto) {
    const existing = await this.shipmentsRepository.findByOrderId(dto.orderId);
    if (existing) {
      if (existing.trackingCode && existing.carrier === (dto.carrier ?? existing.carrier)) {
        // Same order + same carrier → idempotent return
        return existing;
      }
      throw new ConflictException(
        `Order ${dto.orderId} đã có shipment với carrier ${existing.carrier}`,
      );
    }

    const carrier = (dto.carrier as CarrierCode) ?? this.factory.getDefault()?.carrierCode;
    if (!carrier) {
      throw new BadRequestException('Không có carrier nào được cấu hình');
    }
    const provider = this.factory.get(carrier);

    const result = await provider.createShipment({
      orderId: dto.orderId,
      orderNumber: dto.orderNumber,
      fromAddress: dto.fromAddress,
      toAddress: dto.toAddress,
      package: dto.package,
      codAmount: dto.codAmount,
      serviceCode: dto.serviceCode,
      note: dto.note,
      declaredValue: dto.declaredValue,
    });

    const shipment = await this.shipmentsRepository.create({
      orderId: dto.orderId,
      sellerId: dto.sellerId,
      carrier: result.carrierCode,
      trackingCode: result.trackingCode,
      shippingFee: 0, // populated when we get a fee quote
      weight: dto.package.weightGrams,
      estimatedAt: result.estimatedDeliveryAt,
      metadata: result.rawResponse,
    });

    try {
      await this.events.publishCreated({
        shipmentId: shipment.id,
        orderId: shipment.orderId,
        trackingCode: shipment.trackingCode,
        carrier: shipment.carrier,
        estimatedAt: shipment.estimatedAt?.toISOString(),
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish SHIPMENT_CREATED');
    }

    return shipment;
  }

  async getById(id: string) {
    const s = await this.shipmentsRepository.findById(id);
    if (!s) throw new NotFoundException(`Không tìm thấy shipment ${id}`);
    return s;
  }

  async getByTrackingCode(trackingCode: string) {
    const s = await this.shipmentsRepository.findByTrackingCode(trackingCode);
    if (!s) throw new NotFoundException(`Không tìm thấy shipment với tracking ${trackingCode}`);
    return s;
  }

  /**
   * Poll the carrier for the latest status and persist it. Idempotent:
   * a no-op if the persisted status is already equal to the polled one.
   */
  async refreshStatus(trackingCode: string) {
    const persisted = await this.shipmentsRepository.findByTrackingCode(trackingCode);
    if (!persisted) {
      throw new NotFoundException(`Không tìm thấy shipment với tracking ${trackingCode}`);
    }
    const provider = this.factory.get(persisted.carrier as CarrierCode);
    const status = await provider.getTrackingStatus(trackingCode);
    return this.applyStatusChange(persisted, status.status, status.description, status.location);
  }

  /**
   * Apply a status change from any source (webhook or poll). Centralized
   * here so the webhook handler and the refresh endpoint stay in sync.
   */
  async applyStatusChange(
    shipment: any,
    newStatus: ShipmentStatus,
    description?: string,
    location?: string,
  ) {
    if (shipment.status === newStatus && !description && !location) {
      return shipment; // no-op
    }

    const extra: { deliveredAt?: Date; pickedUpAt?: Date; failedReason?: string } = {};
    if (newStatus === 'DELIVERED' && !shipment.deliveredAt) {
      extra.deliveredAt = new Date();
    }
    if (newStatus === 'PICKED_UP' && !shipment.pickedUpAt) {
      extra.pickedUpAt = new Date();
    }
    if (newStatus === 'FAILED_ATTEMPT' && description) {
      extra.failedReason = description;
    }

    const updated = await this.shipmentsRepository.updateStatus(
      shipment.id,
      newStatus,
      extra,
    );

    // Publish status-changed event (always — downstream may want history)
    try {
      await this.events.publishStatusChanged({
        shipmentId: updated.id,
        orderId: updated.orderId,
        trackingCode: updated.trackingCode,
        status: newStatus,
        carrier: updated.carrier,
        description,
        location,
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish SHIPMENT_STATUS_CHANGED');
    }

    // Publish terminal-state events
    if (newStatus === 'DELIVERED') {
      try {
        await this.events.publishDelivered({
          orderId: updated.orderId,
          shipmentId: updated.id,
          deliveredAt: (extra.deliveredAt ?? new Date()).toISOString(),
          trackingCode: updated.trackingCode,
          carrier: updated.carrier,
        });
      } catch (err: any) {
        this.logger.warn({ err: err.message }, 'Failed to publish ORDER_DELIVERED');
      }
    }
    if (newStatus === 'RETURNED' || newStatus === 'CANCELLED') {
      try {
        await this.events.publishFailed({
          shipmentId: updated.id,
          orderId: updated.orderId,
          reason: description ?? newStatus,
        });
      } catch (err: any) {
        this.logger.warn({ err: err.message }, 'Failed to publish SHIPMENT_FAILED');
      }
    }

    return updated;
  }

  async listForSeller(sellerId: string, status?: string) {
    return this.shipmentsRepository.listForSeller(sellerId, status as any);
  }
}
