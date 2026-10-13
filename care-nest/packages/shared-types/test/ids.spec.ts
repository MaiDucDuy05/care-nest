import { describe, it, expect } from 'vitest';
import {
  vnPhoneSchema,
  emailSchema,
  PaginationInputSchema,
  PaymentMethodSchema,
  AlertSeveritySchema,
} from '../src/index.js';

describe('vnPhoneSchema', () => {
  it.each([
    ['0901234567', true],
    ['+84901234567', true],
    ['84901234567', true],
    ['090-123-4567', true], // dashes stripped
    ['090 123 4567', true], // spaces stripped
    ['090.123.4567', true], // dots stripped
    ['abc', false],
    ['12345', false],
  ])('parses %s', (input, valid) => {
    const r = vnPhoneSchema.safeParse(input);
    expect(r.success).toBe(valid);
  });
});

describe('emailSchema', () => {
  it('lowercases and trims', () => {
    expect(emailSchema.parse('  Foo@Bar.COM  ')).toBe('foo@bar.com');
  });
  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('PaginationInputSchema', () => {
  it('applies defaults', () => {
    const r = PaginationInputSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });
  it('coerces string numbers', () => {
    const r = PaginationInputSchema.parse({ page: '2', pageSize: '50' });
    expect(r.page).toBe(2);
    expect(r.pageSize).toBe(50);
  });
  it('rejects pageSize > 200', () => {
    expect(PaginationInputSchema.safeParse({ pageSize: 999 }).success).toBe(false);
  });
});

describe('enums', () => {
  it('PaymentMethod accepts known values', () => {
    expect(PaymentMethodSchema.parse('VNPAY')).toBe('VNPAY');
    expect(PaymentMethodSchema.safeParse('UNKNOWN').success).toBe(false);
  });
  it('AlertSeverity accepts all 4 levels', () => {
    for (const v of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const) {
      expect(AlertSeveritySchema.parse(v)).toBe(v);
    }
  });
});
