import { describe, it, expect } from 'vitest';
import { CreatePaymentSchema, RefundPaymentSchema } from '../src/payments/dto/payment.dto.js';

describe('CreatePaymentSchema', () => {
  it('accepts a valid VNPay payment intent', () => {
    const r = CreatePaymentSchema.safeParse({
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      method: 'VNPAY',
      amount: 1_500_000,
      idempotencyKey: 'idem-001',
    });
    expect(r.success).toBe(true);
  });

  it('rejects zero or negative amount', () => {
    const r = CreatePaymentSchema.safeParse({
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      method: 'COD',
      amount: 0,
      idempotencyKey: 'idem-002',
    });
    expect(r.success).toBe(false);
  });

  it('rejects unsupported payment method', () => {
    const r = CreatePaymentSchema.safeParse({
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      method: 'BITCOIN',
      amount: 100,
      idempotencyKey: 'idem-003',
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty idempotency key', () => {
    const r = CreatePaymentSchema.safeParse({
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      method: 'MOMO',
      amount: 100,
      idempotencyKey: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('RefundPaymentSchema', () => {
  it('accepts full refund with reason', () => {
    const r = RefundPaymentSchema.safeParse({ reason: 'Buyer requested' });
    expect(r.success).toBe(true);
  });

  it('accepts partial refund with amount', () => {
    const r = RefundPaymentSchema.safeParse({ amount: 50_000, reason: 'Item damaged' });
    expect(r.success).toBe(true);
  });

  it('rejects empty reason', () => {
    const r = RefundPaymentSchema.safeParse({ amount: 50_000 });
    expect(r.success).toBe(false);
  });
});
