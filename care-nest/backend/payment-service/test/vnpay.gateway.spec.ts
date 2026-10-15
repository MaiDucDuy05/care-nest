import { describe, it, expect } from 'vitest';
import { VnpayGateway } from '../src/gateways/vnpay.gateway.js';

describe('VnpayGateway', () => {
  it('builds a payment URL with vnp_SecureHash', async () => {
    const gw = new VnpayGateway();
    const r = await gw.createPayment({
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount: 100_000,
      orderInfo: 'Test order',
      returnUrl: 'http://localhost:3005/return',
      idempotencyKey: 'idem-1',
    });
    expect(r.paymentUrl).toContain('sandbox.vnpayment.vn');
    expect(r.paymentUrl).toContain('vnp_SecureHash=');
    expect(r.transactionRef).toBeTruthy();
  });

  it('rejects webhook with bad signature', () => {
    const gw = new VnpayGateway();
    const result = gw.verifyWebhook({
      raw: { vnp_TxnRef: 'abc', vnp_ResponseCode: '00', vnp_SecureHash: 'deadbeef' },
      gateway: 'VNPAY',
      signature: 'deadbeef',
    });
    expect(result.isValid).toBe(false);
  });
});
