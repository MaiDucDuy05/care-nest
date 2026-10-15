import { Injectable, Logger } from '@nestjs/common';
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
 * Giao Hàng Tiết Kiệm (GHTK) — the runner-up carrier in Vietnam.
 * Generally cheaper for inner-city and tier-2 routes.
 *
 * API doc: https://docs.ghtk.vn/
 *
 * GHTK status codes (numeric, used in their `status` field):
 *   -1   -> CANCELLED
 *   1    -> CREATED
 *   2    -> PICKED_UP
 *   3    -> IN_TRANSIT
 *   4    -> IN_TRANSIT (storing at hub)
 *   5    -> OUT_FOR_DELIVERY
 *   6    -> DELIVERED
 *   7    -> RETURNED
 *   8    -> EXCEPTION
 *   9    -> FAILED_DELIVERY
 *   10   -> RETURNED (returning to sender)
 *   11   -> RETURNED (returned to sender)
 *   12   -> EXCEPTION (lost/damaged)
 *   13   -> IN_TRANSIT (picked up but not yet at hub)
 *   20   -> DELIVERED (partial COD)
 *   21   -> EXCEPTION (post-delivery dispute)
 */
@Injectable()
export class GhtkProvider implements IShippingProvider {
  readonly carrierCode: CarrierCode = 'GHTK';
  private readonly logger = new Logger(GhtkProvider.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = process.env.GHTK_BASE_URL || 'https://services.giaohangtietkiem.vn';
    this.token = process.env.GHTK_TOKEN || '';
  }

  private isConfigured(): boolean {
    return this.token.length > 0;
  }

  async calculateFee(input: {
    fromAddress: ShippingAddress;
    toAddress: ShippingAddress;
    package: PackageDimensions;
    serviceCode?: string;
  }): Promise<FeeQuote> {
    if (!this.isConfigured()) {
      return this.sandboxFee(input);
    }
    this.logger.warn('GHTK real API call not implemented — returning sandbox quote');
    return this.sandboxFee(input);
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured()) {
      return this.sandboxCreate(input);
    }
    this.logger.warn('GHTK real createShipment not implemented — returning sandbox result');
    return this.sandboxCreate(input);
  }

  async getTrackingStatus(trackingCode: string): Promise<TrackingStatus> {
    if (!this.isConfigured()) {
      return this.sandboxTrack(trackingCode);
    }
    this.logger.warn('GHTK real getTrackingStatus not implemented — returning sandbox status');
    return this.sandboxTrack(trackingCode);
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): WebhookVerificationResult {
    const secret = process.env.GHTK_WEBHOOK_SECRET || this.token;
    return verifyHmacSignature(rawBody, signature, secret);
  }

  private sandboxFee(input: { fromAddress: ShippingAddress; toAddress: ShippingAddress; package: PackageDimensions; serviceCode?: string }): FeeQuote {
    // Slightly cheaper than GHN — base 18k, 4k/kg, 10k for cross-province
    const base = 18_000;
    const weight = input.package.weightGrams;
    const perKg = Math.ceil(weight / 1000) * 4_000;
    const sameProvince = input.fromAddress.province === input.toAddress.province;
    const distance = sameProvince ? 0 : 10_000;
    const total = base + perKg + distance;
    return {
      totalFee: total,
      serviceFee: total,
      insuranceFee: 0,
      estimatedDeliveryDays: sameProvince ? 3 : 5,
      carrierCode: 'GHTK',
      serviceCode: input.serviceCode || 'standard',
    };
  }

  private sandboxCreate(input: CreateShipmentInput): CreateShipmentResult {
    const trackingCode = `GHTK${Date.now().toString(36).toUpperCase()}-${input.orderNumber}`;
    return {
      trackingCode,
      carrierCode: 'GHTK',
      estimatedDeliveryAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      rawResponse: { sandbox: true, input: { orderId: input.orderId, orderNumber: input.orderNumber } },
    };
  }

  private sandboxTrack(trackingCode: string): TrackingStatus {
    return {
      status: 'IN_TRANSIT',
      description: 'Đang vận chuyển (sandbox GHTK)',
      lastUpdateAt: new Date(),
      location: 'TP.HCM',
      rawResponse: { sandbox: true, trackingCode },
    };
  }

  static mapStatus(ghtkStatus: number | string): ShipmentStatus {
    const m: Record<string, ShipmentStatus> = {
      '-1': 'CANCELLED',
      '1': 'PENDING_PICKUP',
      '2': 'PICKED_UP',
      '3': 'IN_TRANSIT',
      '4': 'IN_TRANSIT',
      '5': 'OUT_FOR_DELIVERY',
      '6': 'DELIVERED',
      '7': 'RETURNED',
      '8': 'FAILED_ATTEMPT',
      '9': 'FAILED_ATTEMPT',
      '10': 'RETURNED',
      '11': 'RETURNED',
      '12': 'FAILED_ATTEMPT',
      '13': 'IN_TRANSIT',
      '20': 'DELIVERED',
      '21': 'FAILED_ATTEMPT',
    };
    return m[String(ghtkStatus)] ?? 'FAILED_ATTEMPT';
  }
}
