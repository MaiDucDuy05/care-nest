import { Injectable, BadRequestException } from '@nestjs/common';
import type { CreatePaymentInput, CreatePaymentResult, WebhookPayload, WebhookVerification } from './payment-gateway.js';
import { PaymentGateway, hmacSha256 } from './payment-gateway.js';

/**
 * MoMo adapter (v2 API).
 *
 * - Sandbox: https://test-payment.momo.vn/v2/gateway/api/create
 * - Production: https://payment.momo.vn/v2/gateway/api/create
 *
 * Signature: HMAC-SHA256 over a canonical string built from request fields.
 */
@Injectable()
export class MomoGateway extends PaymentGateway {
  readonly name = 'MOMO' as const;
  private readonly endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
  private readonly partnerCode = (process.env.MOMO_PARTNER_CODE || '').trim();
  private readonly accessKey = (process.env.MOMO_ACCESS_KEY || '').trim();
  private readonly secretKey = (process.env.MOMO_SECRET_KEY || '').trim();
  private readonly returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3000/vi/shop/payment/momo-return';
  private readonly notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3005/api/v1/webhooks/momo';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const isMock = !this.partnerCode || !this.accessKey || !this.secretKey || this.partnerCode === 'MOMOSANDBOX2024';
    if (isMock) {
      if (process.env.NODE_ENV === 'test') {
        const dummyRef = `MOMOSANDBOX2024-${Date.now()}`;
        return {
          paymentUrl: `${input.returnUrl || this.returnUrl}?orderId=${input.orderId}&requestId=${dummyRef}&amount=${input.amount}&signature=mock_signature`,
          transactionRef: dummyRef,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
      }
      throw new BadRequestException(
        'Hệ thống chưa được cấu hình tài khoản MoMo Merchant (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY trong .env). Quý khách vui lòng chọn thanh toán qua VNPay hoặc Quét mã VietQR.',
      );
    }

    const requestId = `${this.partnerCode}-${Date.now()}`;
    const orderId = input.orderId;
    const amount = String(input.amount);
    const orderInfo = input.orderInfo;
    const extraData = Buffer.from(JSON.stringify({ idempotencyKey: input.idempotencyKey })).toString('base64');

    const targetReturnUrl = input.returnUrl || this.returnUrl;
    // Canonical signing string (per MoMo docs v2 captureWallet)
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${targetReturnUrl}&requestId=${requestId}&requestType=captureWallet`;
    const signature = hmacSha256(this.secretKey, rawSignature);

    const body = {
      partnerCode: this.partnerCode,
      partnerName: 'CareNest',
      storeId: 'CareNestStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: targetReturnUrl,
      ipnUrl: this.notifyUrl,
      extraData,
      requestType: 'captureWallet',
      signature,
      lang: 'vi',
    };

    // Call MoMo API to obtain payment link (payUrl)
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { payUrl?: string; message?: string; resultCode?: number };
      if (res.ok && data.payUrl) {
        return {
          paymentUrl: data.payUrl,
          transactionRef: requestId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
      }
      throw new BadRequestException(data.message || 'Cổng thanh toán MoMo từ chối tạo giao dịch.');
    } catch (err: any) {
      throw new BadRequestException(
        err.message || 'Không thể kết nối đến cổng thanh toán MoMo Sandbox. Vui lòng thử lại sau hoặc chọn VNPay.',
      );
    }
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
