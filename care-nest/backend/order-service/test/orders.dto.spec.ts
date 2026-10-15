import { describe, it, expect } from 'vitest';
import { CheckoutSchema, ShippingAddressSchema } from '../src/orders/dto/order.dto.js';

describe('CheckoutSchema', () => {
  it('accepts a valid checkout payload', () => {
    const r = CheckoutSchema.safeParse({
      shippingAddress: {
        name: 'Nguyen Van A',
        phone: '0901234567',
        line1: '123 Nguyen Hue',
        district: 'Quan 1',
        province: 'TP HCM',
        country: 'VN',
      },
      paymentMethod: 'VNPAY',
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing shippingAddress.line1', () => {
    const r = CheckoutSchema.safeParse({
      shippingAddress: { name: 'X', phone: '0901', district: 'D', province: 'P' },
      paymentMethod: 'COD',
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown payment method', () => {
    const r = CheckoutSchema.safeParse({
      shippingAddress: { name: 'X', phone: '0901', line1: 'L', district: 'D', province: 'P' },
      paymentMethod: 'PAYPAL',
    });
    expect(r.success).toBe(false);
  });

  it('defaults country to VN', () => {
    const r = ShippingAddressSchema.parse({ name: 'X', phone: '0901234567', line1: 'L', district: 'D', province: 'P' });
    expect(r.country).toBe('VN');
  });
});
