import { describe, it, expect } from 'vitest';
import { MomoGateway } from '../src/gateways/momo.gateway.js';
import { CodGateway } from '../src/gateways/cod.gateway.js';

describe('MomoGateway', () => {
  it('builds a payment URL with signature', async () => {
    const gw = new MomoGateway();
    const r = await gw.createPayment({
      orderId: 'order-1',
      amount: 50_000,
      orderInfo: 'Test',
      returnUrl: 'http://localhost:3005/return',
      idempotencyKey: 'idem-1',
    });
    expect(r.transactionRef).toContain('MOMOSANDBOX2024');
    expect(r.paymentUrl).toContain('signature=');
  });
});

describe('CodGateway', () => {
  it('returns a cod:// scheme URL', async () => {
    const gw = new CodGateway();
    const r = await gw.createPayment({
      orderId: 'order-cod-1',
      amount: 200_000,
      orderInfo: 'Cash on delivery',
      returnUrl: '',
      idempotencyKey: 'idem-cod',
    });
    expect(r.paymentUrl).toMatch(/^cod:\/\/collect\//);
  });
});
