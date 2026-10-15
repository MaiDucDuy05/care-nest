import { Injectable } from '@nestjs/common';
import type { CreatePaymentInput, CreatePaymentResult, WebhookPayload, WebhookVerification } from './payment-gateway.js';
import { PaymentGateway, hmacSha256 } from './payment-gateway.js';

/**
 * MoMo adapter (v2 API).
 *
 * - Sandbox: https://test.momo.vn/v2/gateway/api/create
 * - Production: https://payment.momo.vn/v2/gateway/api/create
 *
 * Signature: HMAC-SHA256 over a canonical string built from request fields.
 */
@Injectable()
export class MomoGateway extends PaymentGateway {
  readonly name = 'MOMO' as const;
  private readonly endpoint = process.env.MOMO_ENDPOINT || 'https://test.momo.vn/v2/gateway/api/create';
  private readonly partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMOSANDBOX2024';
  private readonly accessKey = process.env.MOMO_ACCESS_KEY || 'SANDBOX_ACCESS_KEY';
  private readonly secretKey = process.env.MOMO_SECRET_KEY || 'SANDBOX_SECRET_KEY';
  private readonly returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3005/api/v1/webhooks/momo/return';
  private readonly notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3005/api/v1/webhooks/momo/notify';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const requestId = `${this.partnerCode}-${Date.now()}`;
    const orderId = input.orderId;
    const amount = String(input.amount);
    const orderInfo = input.orderInfo;
    const extraData = Buffer.from(JSON.stringify({ idempotencyKey: input.idempotencyKey })).toString('base64');

    // Canonical signing string (per MoMo docs)
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.returnUrl}&requestId=${requestId}&requestType=payWithMethod`;
    const signature = hmacSha256(this.secretKey, rawSignature);

    const body = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.returnUrl,
      ipnUrl: this.notifyUrl,
      extraData,
      requestType: 'payWithMethod',
      signature,
      lang: 'vi',
    };

    // In a real implementation we'd POST to MoMo here. For dev we return a
    // URL that hits our own /return endpoint so the dev can simulate the flow.
    const paymentUrl = `${this.returnUrl}?orderId=${orderId}&requestId=${requestId}&amount=${amount}&signature=${signature}`;

    return {
      paymentUrl,
      transactionRef: requestId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  verifyWebhook(payload: WebhookPayload): WebhookVerification {
    const raw = payload.raw;
    const received = raw['signature'] || '';
    const {
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payUrl,
      requestId,
      responseTime,
      resultCode,
      transId,
    } = raw;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payUrl=${payUrl}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expected = hmacSha256(this.secretKey, rawSignature);

    if (expected !== received) {
      return { isValid: false, message: 'Invalid MoMo signature' };
    }

    return {
      isValid: resultCode === '0',
      transactionRef: orderId,
      responseCode: resultCode,
      amount: amount ? parseInt(amount, 10) : undefined,
      message,
    };
  }
}
