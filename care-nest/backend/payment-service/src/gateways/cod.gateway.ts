import { Injectable } from '@nestjs/common';
import type { CreatePaymentInput, CreatePaymentResult, WebhookPayload, WebhookVerification } from './payment-gateway.js';
import { PaymentGateway } from './payment-gateway.js';

/**
 * Cash on Delivery adapter.
 *
 * No real gateway call — instead, the "create" step records the intent
 * to collect cash, and the "webhook" is triggered by the courier confirming
 * delivery (out of scope for Phase 1; the order is marked DELIVERED → COMPLETED
 * by the courier webhook in Phase 2).
 *
 * For Phase 1, COD "payments" are considered successful on create and
 * escrow is held until the courier confirms delivery.
 */
@Injectable()
export class CodGateway extends PaymentGateway {
  readonly name = 'COD' as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      paymentUrl: `cod://collect/${input.orderId}`,
      transactionRef: `cod-${input.orderId}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  verifyWebhook(_payload: WebhookPayload): WebhookVerification {
    // COD is confirmed on delivery by the courier; the webhook is a no-op here.
    return { isValid: true, responseCode: '0', message: 'COD — confirmed on delivery' };
  }
}
