import { Injectable, Logger } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';
import { KAFKA_TOPICS } from '@carenest/shared-config';

/**
 * Payment gateway adapter contract.
 *
 * Each gateway (VNPay, MoMo, ZaloPay, COD) implements this interface so the
 * payments service can dispatch by `method` without knowing the protocol.
 *
 * Adapters are stateless. The persistent state lives in the `payments` table.
 */
export interface CreatePaymentInput {
  orderId: string;
  amount: number; // VND, integer
  orderInfo: string;
  returnUrl: string;
  ipAddr?: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  paymentUrl: string;
  transactionRef: string;
  expiresAt: Date;
}

export interface WebhookPayload {
  raw: Record<string, string>;
  gateway: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'COD';
  signature: string;
}

export interface WebhookVerification {
  isValid: boolean;
  transactionRef?: string;
  responseCode?: string;
  amount?: number;
  message?: string;
}

export interface RefundInput {
  transactionRef: string;
  amount: number; // VND, integer
  reason?: string;
}

export interface RefundResult {
  refundRef: string;
  accepted: boolean;
  message?: string;
}

@Injectable()
export abstract class PaymentGateway {
  abstract readonly name: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'COD';
  protected readonly logger = new Logger(this.constructor.name);

  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  abstract verifyWebhook(payload: WebhookPayload): WebhookVerification;

  /**
   * Push the refund to the upstream gateway. The default impl is a
   * dev-only stub that returns a synthetic refund ref. Gateways
   * override this in production. We never throw on a failed refund
   * here — callers decide whether to retry or mark manual.
   */
  async refund(_input: RefundInput): Promise<RefundResult> {
    this.logger.warn(
      { name: this.name },
      'Gateway has no real refund() impl — returning synthetic refund ref'
    );
    return {
      refundRef: `dev-refund-${Date.now()}`,
      accepted: true,
      message: 'dev-only synthetic refund',
    };
  }
}

/** Helper: SHA-256 HMAC hex */
export function hmacSha256(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

/** Helper: SHA-256 hash hex */
export function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
