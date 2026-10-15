import { describe, it, expect } from 'vitest';
import {
  QuoteFeeSchema,
  CreateShipmentSchema,
} from '../src/shipments/dto/shipments.dto.js';

const validAddress = {
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  address: '123 Nguyễn Trãi',
  ward: 'Phường 2',
  district: 'Quận 5',
  province: 'TP.HCM',
};

const validPackage = { weightGrams: 500 };

describe('QuoteFeeSchema', () => {
  it('accepts minimal valid input', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
    });
    expect(r.success).toBe(true);
  });

  it('defaults country to VN', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
    });
    if (r.success) {
      expect((r.data.fromAddress as any).country).toBe('VN');
    }
  });

  it('rejects bad phone format', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: { ...validAddress, phone: 'abc' },
      toAddress: validAddress,
      package: validPackage,
    });
    expect(r.success).toBe(false);
  });

  it('rejects too-heavy package', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: validAddress,
      toAddress: validAddress,
      package: { weightGrams: 100_000 },
    });
    expect(r.success).toBe(false);
  });

  it('accepts optional carrier choice', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
      carrier: 'GHN',
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown carrier', () => {
    const r = QuoteFeeSchema.safeParse({
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
      carrier: 'UPS',
    });
    expect(r.success).toBe(false);
  });
});

describe('CreateShipmentSchema', () => {
  it('accepts minimal valid input', () => {
    const r = CreateShipmentSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      orderNumber: 'CN-2026-001',
      sellerId: '550e8400-e29b-41d4-a716-446655440001',
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-UUID orderId', () => {
    const r = CreateShipmentSchema.safeParse({
      orderId: 'not-a-uuid',
      orderNumber: 'CN-2026-001',
      sellerId: '550e8400-e29b-41d4-a716-446655440001',
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
    });
    expect(r.success).toBe(false);
  });

  it('defaults codAmount to 0', () => {
    const r = CreateShipmentSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      orderNumber: 'CN-2026-001',
      sellerId: '550e8400-e29b-41d4-a716-446655440001',
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
    });
    if (r.success) expect(r.data.codAmount).toBe(0);
  });

  it('rejects negative COD', () => {
    const r = CreateShipmentSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      orderNumber: 'CN-2026-001',
      sellerId: '550e8400-e29b-41d4-a716-446655440001',
      fromAddress: validAddress,
      toAddress: validAddress,
      package: validPackage,
      codAmount: -1,
    });
    expect(r.success).toBe(false);
  });
});
