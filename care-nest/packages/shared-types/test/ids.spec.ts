import { describe, it, expect } from 'vitest';
import {
  vnPhoneSchema,
  emailSchema,
  PaginationInputSchema,
  PaymentMethodSchema,
  AlertSeveritySchema,
  asPlanId,
  asSubscriptionId,
  asShipmentId,
  asGeofenceId,
  asCaregiverId,
  asDeviceAssignmentId,
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

describe('branded IDs — CUID and UUID', () => {
  const VALID_CUID = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
  const VALID_UUID = '0180c19c-0000-4000-8000-000000000001';

  it('asDeviceAssignmentId accepts CUID', () => {
    expect(asDeviceAssignmentId(VALID_CUID)).toBe(VALID_CUID);
  });
  it('asDeviceAssignmentId accepts UUID', () => {
    expect(asDeviceAssignmentId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asDeviceAssignmentId rejects garbage', () => {
    expect(() => asDeviceAssignmentId('not-an-id')).toThrow();
  });

  it('asPlanId accepts UUID', () => {
    expect(asPlanId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asPlanId rejects garbage', () => {
    expect(() => asPlanId('xxx')).toThrow();
  });

  it('asSubscriptionId accepts UUID', () => {
    expect(asSubscriptionId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asSubscriptionId rejects garbage', () => {
    expect(() => asSubscriptionId('')).toThrow();
  });

  it('asShipmentId accepts UUID', () => {
    expect(asShipmentId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asShipmentId rejects garbage', () => {
    expect(() => asShipmentId('ship-123')).toThrow();
  });

  it('asGeofenceId accepts UUID', () => {
    expect(asGeofenceId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asGeofenceId rejects garbage', () => {
    expect(() => asGeofenceId('abc')).toThrow();
  });

  it('asCaregiverId accepts UUID', () => {
    expect(asCaregiverId(VALID_UUID)).toBe(VALID_UUID);
  });
  it('asCaregiverId rejects garbage', () => {
    expect(() => asCaregiverId('')).toThrow();
  });
});
