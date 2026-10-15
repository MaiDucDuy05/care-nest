import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import type { CreatePaymentInput, CreatePaymentResult, WebhookPayload, WebhookVerification } from './payment-gateway.js';
import { PaymentGateway } from './payment-gateway.js';

/**
 * VNPay adapter.
 *
 * - Sandbox URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 * - Production: https://pay.vnpay.vn/vpcpay/vpcpay.html
 *
 * Signature algorithm (VNPay):
 *   1. Sort query params alphabetically (excluding vnp_SecureHash)
 *   2. Build `key1=value1&key2=value2&...` string
 *   3. URL-decode value placeholders, then HMAC-SHA512 with secret
 *   4. Compare with vnp_SecureHash (case-insensitive)
 *
 * Reference: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 */
@Injectable()
export class VnpayGateway extends PaymentGateway {
  readonly name = 'VNPAY' as const;
  private readonly sandboxUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly tmnCode = process.env.VNPAY_TMN_CODE || 'SANDBOX_TMN';
  private readonly hashSecret = process.env.VNPAY_HASH_SECRET || 'SANDBOX_HASH_SECRET';
  private readonly returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3005/api/v1/webhooks/vnpay/return';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const date = new Date();
    const createDate = this.formatVnpDate(date);
    const expireDate = this.formatVnpDate(new Date(date.getTime() + 15 * 60 * 1000));

    // Generate a gateway-side transaction reference
    const transactionRef = `${input.orderId.replace(/-/g, '').slice(0, 12)}${Date.now()}`;

    // Build params in alphabetical order (per VNPay spec)
    const params: Record<string, string> = {
      vnp_Amount: String(input.amount * 100), // VNPay expects amount * 100
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_ExpireDate: expireDate,
      vnp_IpAddr: input.ipAddr || '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: input.returnUrl || this.returnUrl,
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: transactionRef,
      vnp_Version: '2.1.0',
    };

    // Sort + build signing string
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .map((k) => `${k}=${this.encodeVNPay(params[k]!)}`)
      .join('&');
    const crypto = await import('crypto');
    const secureHash = crypto.createHmac('sha512', this.hashSecret).update(signData).digest('hex');

    // Build final URL
    const queryString = sortedKeys
      .map((k) => `${k}=${this.encodeVNPay(params[k]!)}`)
      .join('&');
    const paymentUrl = `${this.sandboxUrl}?${queryString}&vnp_SecureHash=${secureHash}`;

    return {
      paymentUrl,
      transactionRef,
      expiresAt: new Date(date.getTime() + 15 * 60 * 1000),
    };
  }

  verifyWebhook(payload: WebhookPayload): WebhookVerification {
    const raw = payload.raw;
    const receivedHash = raw['vnp_SecureHash'] || '';
    const paramsForSign: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'vnp_SecureHash' || k === 'vnp_SecureHashType') continue;
      paramsForSign[k] = v;
    }
    const sortedKeys = Object.keys(paramsForSign).sort();
    const signData = sortedKeys.map((k) => `${k}=${this.encodeVNPay(paramsForSign[k]!)}`).join('&');

    const crypto = { createHmac, randomBytes } as typeof import('crypto');
    const expected = crypto.createHmac('sha512', this.hashSecret).update(signData).digest('hex');

    const isValid = expected.toLowerCase() === receivedHash.toLowerCase();
    if (!isValid) {
      return { isValid: false, message: 'Invalid signature' };
    }

    return {
      isValid: true,
      transactionRef: raw['vnp_TxnRef'],
      responseCode: raw['vnp_ResponseCode'],
      amount: raw['vnp_Amount'] ? parseInt(raw['vnp_Amount'], 10) / 100 : undefined,
      message: raw['vnp_OrderInfo'],
    };
  }

  private encodeVNPay(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+').replace(/%2F/g, '/');
  }

  private formatVnpDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }
}
