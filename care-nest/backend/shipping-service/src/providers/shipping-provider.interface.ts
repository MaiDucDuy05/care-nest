/**
 * IShippingProvider — the contract every carrier integration must implement.
 *
 * The factory in `shipping-provider.factory.ts` selects the right adapter
 * at runtime. We keep the interface narrow (4 methods) so wrapping a new
 * carrier stays cheap:
 *
 *   1. `calculateFee` — quote shipping cost (sync, used at checkout)
 *   2. `createShipment` — hand off an order to the carrier (returns tracking code)
 *   3. `getTrackingStatus` — poll the carrier for the latest status
 *   4. `verifyWebhookSignature` — verify a status-update webhook is genuine
 *
 * Status enums are mapped from each carrier's idiosyncratic state names
 * (GHN uses "ready_to_pick", GHTK uses "-1") to our internal enum, so the
 * rest of the system only ever sees one vocabulary.
 */

export type CarrierCode = 'GHN' | 'GHTK';

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string; // line1
  ward: string;
  district: string;
  province: string;
  country?: string; // default 'VN'
}

export interface PackageDimensions {
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface FeeQuote {
  totalFee: number; // VND
  serviceFee: number;
  insuranceFee: number;
  estimatedDeliveryDays: number;
  carrierCode: CarrierCode;
  serviceCode: string; // carrier-specific service id
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  package: PackageDimensions;
  codAmount?: number; // 0 = prepaid
  serviceCode?: string; // carrier-specific
  note?: string;
  /** Total declared value in VND (for insurance). */
  declaredValue?: number;
}

export interface CreateShipmentResult {
  trackingCode: string;
  carrierCode: CarrierCode;
  estimatedDeliveryAt?: Date;
  rawResponse: unknown;
}

export type ShipmentStatus =
  | 'PENDING_PICKUP' // handed to carrier, awaiting pickup
  | 'PICKED_UP' // courier collected
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_ATTEMPT' // delivery attempt failed (will retry or return)
  | 'RETURNED'
  | 'CANCELLED';

export interface TrackingStatus {
  status: ShipmentStatus;
  description?: string;
  lastUpdateAt?: Date;
  location?: string;
  rawResponse: unknown;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
}

export interface IShippingProvider {
  readonly carrierCode: CarrierCode;

  /** Quote the shipping fee for the given route + package. Pure read. */
  calculateFee(input: {
    fromAddress: ShippingAddress;
    toAddress: ShippingAddress;
    package: PackageDimensions;
    serviceCode?: string;
  }): Promise<FeeQuote>;

  /** Hand the order off to the carrier. Returns the tracking code. */
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;

  /** Poll the carrier for the latest status of a tracking code. */
  getTrackingStatus(trackingCode: string): Promise<TrackingStatus>;

  /**
   * Verify a webhook payload signature. Implementations should be CONSTANT
   * TIME to prevent timing-attack disclosure of the shared secret.
   */
  verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
  ): WebhookVerificationResult;
}
