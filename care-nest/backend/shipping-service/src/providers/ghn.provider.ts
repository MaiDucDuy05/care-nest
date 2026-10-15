import { Injectable, Logger, BadRequestException, NotImplementedException } from '@nestjs/common';
import {
  type CarrierCode,
  type CreateShipmentInput,
  type CreateShipmentResult,
  type FeeQuote,
  type IShippingProvider,
  type ShippingAddress,
  type PackageDimensions,
  type ShipmentStatus,
  type TrackingStatus,
  type WebhookVerificationResult,
} from './shipping-provider.interface.js';
import { verifyHmacSignature } from './webhook-signature.js';

/**
 * Giao Hàng Nhanh (GHN) — the dominant B2C carrier in Vietnam.
 *
 * API doc: https://api.ghn.vn/home/docs (we use the dev gateway in Phase 2)
 * Status codes: https://api.ghn.vn/home/docs/detail?id=23
 *
 * Status mapping:
 *   "ready_to_pick"  -> CREATED
 *   "picking"        -> PICKED_UP
 *   "transporting"   -> IN_TRANSIT
 *   "delivering"     -> OUT_FOR_DELIVERY
 *   "delivered"      -> DELIVERED
 *   "delivery_fail"  -> FAILED_DELIVERY
 *   "return"         -> RETURNED
 *   "cancel"         -> CANCELLED
 *   "exception"      -> EXCEPTION
 */
@Injectable()
export class GhnProvider implements IShippingProvider {
  readonly carrierCode: CarrierCode = 'GHN';
  private readonly logger = new Logger(GhnProvider.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly shopId: string;

  constructor() {
    this.baseUrl = process.env.GHN_BASE_URL || 'https://dev-online-gateway.ghn.vn';
    this.token = process.env.GHN_TOKEN || '';
    this.shopId = process.env.GHN_SHOP_ID || '';
  }

  private isConfigured(): boolean {
    return this.token.length > 0 && this.shopId.length > 0;
  }

  async calculateFee(input: {
    fromAddress: ShippingAddress;
    toAddress: ShippingAddress;
    package: PackageDimensions;
    serviceCode?: string;
  }): Promise<FeeQuote> {
    if (!this.isConfigured()) {
      // Sandbox / dev: return a deterministic fake quote so the dev flow works
      return this.sandboxFee(input);
    }
    // Real call would POST to /shiip/public-api/v2/shipping-order/fee
    // with service_id, from_district, to_district, weight, etc.
    // We stub the network call for Phase 2 — Phase 3 will wire it up.
    this.logger.warn('GHN real API call not implemented — returning sandbox quote');
    return this.sandboxFee(input);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.sandboxCreate(input);
    }
    this.logger.warn('GHN real createShipment not implemented — returning sandbox result');
    return this.sandboxCreate(input);
  }

  async getTrackingStatus(trackingCode: string): Promise<TrackingStatus> {
    if (!this.isConfigured()) {
      return this.sandboxTrack(trackingCode);
    }
    this.logger.warn('GHN real getTrackingStatus not implemented — returning sandbox status');
    return this.sandboxTrack(trackingCode);
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): WebhookVerificationResult {
    const secret = process.env.GHN_WEBHOOK_SECRET || this.token;
    return verifyHmacSignature(rawBody, signature, secret);
  }

  /** Deterministic sandbox output for local dev (no real network call). */
  private sandboxFee(input: { fromAddress: ShippingAddress; toAddress: ShippingAddress; package: PackageDimensions; serviceCode?: string }): FeeQuote {
    // Base 22k VND + 5k per kg + 2k per district
    const base = 22_000;
    const weight = input.package.weightGrams;
    const perKg = Math.ceil(weight / 1000) * 5_000;
    const sameProvince = input.fromAddress.province === input.toAddress.province;
    const distance = sameProvince ? 0 : 12_000;
    const total = base + perKg + distance;
    return {
      totalFee: total,
      serviceFee: total,
      insuranceFee: 0,
      estimatedDeliveryDays: sameProvince ? 2 : 4,
      carrierCode: 'GHN',
      serviceCode: input.serviceCode || 'standard',
    };
  }

  private sandboxCreate(input: CreateShipmentInput): CreateShipmentResult {
    const trackingCode = `GHN-${input.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    return {
      trackingCode,
      carrierCode: 'GHN',
      estimatedDeliveryAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      rawResponse: { sandbox: true, input: { orderId: input.orderId, orderNumber: input.orderNumber } },
    };
  }

  private sandboxTrack(trackingCode: string): TrackingStatus {
    return {
      status: 'IN_TRANSIT',
      description: 'Đang vận chuyển (sandbox)',
      lastUpdateAt: new Date(),
      location: 'Hà Nội',
      rawResponse: { sandbox: true, trackingCode },
    };
  }

  /**
   * Map a GHN status string to our internal ShipmentStatus enum.
   * Exported for use by the webhook handler in `webhooks.controller.ts`.
   */
  static mapStatus(ghnStatus: string): ShipmentStatus {
    const m: Record<string, ShipmentStatus> = {
      ready_to_pick: 'PENDING_PICKUP',
      picking: 'PICKED_UP',
      transporting: 'IN_TRANSIT',
      storing: 'IN_TRANSIT',
      delivering: 'OUT_FOR_DELIVERY',
      delivered: 'DELIVERED',
      delivery_fail: 'FAILED_ATTEMPT',
      waiting_to_return: 'RETURNED',
      return: 'RETURNED',
      returned: 'RETURNED',
      cancel: 'CANCELLED',
      exception: 'FAILED_ATTEMPT',
    };
    return m[ghnStatus] ?? 'FAILED_ATTEMPT';
  }
}
