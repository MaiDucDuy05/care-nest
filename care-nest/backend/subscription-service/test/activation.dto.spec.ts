import { describe, it, expect } from 'vitest';
import {
  CreateActivationCodeSchema,
  RedeemActivationCodeSchema,
} from '../src/activation/dto/activation.dto.js';

describe('CreateActivationCodeSchema', () => {
  it('accepts a valid request', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: ['123456789012345', '123456789012346'],
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-UUID orderId', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: 'not-a-uuid',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: ['123456789012345'],
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty imeiList', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects IMEI with letters', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: ['1234567890ABCDE'],
    });
    expect(r.success).toBe(false);
  });

  it('rejects IMEI that is too short (13 digits)', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: ['1234567890123'],
    });
    expect(r.success).toBe(false);
  });

  it('accepts 14- and 16-digit IMEIs', () => {
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList: ['12345678901234', '1234567890123456'],
    });
    expect(r.success).toBe(true);
  });

  it('rejects more than 10 IMEIs', () => {
    const imeiList = Array.from({ length: 11 }, (_, i) =>
      `12345678901234${i.toString().padStart(1, '0')}`,
    );
    const r = CreateActivationCodeSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      imeiList,
    });
    expect(r.success).toBe(false);
  });
});

describe('RedeemActivationCodeSchema', () => {
  it('accepts token-only', () => {
    const r = RedeemActivationCodeSchema.safeParse({
      token: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(r.success).toBe(true);
  });

  it('accepts token + deviceId', () => {
    const r = RedeemActivationCodeSchema.safeParse({
      token: '550e8400-e29b-41d4-a716-446655440000',
      deviceId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-UUID token', () => {
    const r = RedeemActivationCodeSchema.safeParse({ token: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });
});
