import { describe, it, expect } from 'vitest';
import { createHmac, randomUUID } from 'node:crypto';
import {
  CreatePlanSchema,
  UpdatePlanSchema,
} from '../src/plans/dto/plans.dto.js';

describe('CreatePlanSchema', () => {
  it('accepts a minimal valid plan', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic',
      name: 'Gói cơ bản',
      priceMonthly: 100_000,
      features: { sos: true, calls: 50 },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.code).toBe('basic');
      expect(r.data.deviceLimit).toBe(1); // default
      expect(r.data.caregiverLimit).toBe(1); // default
      expect(r.data.retentionMonths).toBe(6); // default
    }
  });

  it('rejects uppercase code', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'BASIC',
      name: 'Basic',
      priceMonthly: 100_000,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('rejects code with hyphens', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic-plan',
      name: 'Basic',
      priceMonthly: 100_000,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('rejects code starting with a digit', () => {
    const r = CreatePlanSchema.safeParse({
      code: '1basic',
      name: 'Basic',
      priceMonthly: 100_000,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('coerces numeric strings from JSON', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic',
      name: 'Basic',
      priceMonthly: '100000', // string, as it would arrive from form-data
      features: {},
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.priceMonthly).toBe(100_000);
  });

  it('rejects negative price', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic',
      name: 'Basic',
      priceMonthly: -1,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('rejects price over 100M (sanity cap)', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic',
      name: 'Basic',
      priceMonthly: 200_000_000,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('rejects deviceLimit of 0', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'basic',
      name: 'Basic',
      priceMonthly: 100_000,
      deviceLimit: 0,
      features: {},
    });
    expect(r.success).toBe(false);
  });

  it('accepts nested object features', () => {
    const r = CreatePlanSchema.safeParse({
      code: 'family',
      name: 'Gói gia đình',
      priceMonthly: 300_000,
      deviceLimit: 5,
      caregiverLimit: 3,
      retentionMonths: 12,
      features: {
        sos: true,
        geoFence: true,
        calls: 200,
        tier: 'pro',
      },
    });
    expect(r.success).toBe(true);
  });
});

describe('UpdatePlanSchema', () => {
  it('omits code field', () => {
    const r = UpdatePlanSchema.safeParse({ code: 'changed', name: 'New name' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as any).code).toBeUndefined();
      expect(r.data.name).toBe('New name');
    }
  });

  it('allows empty-ish partial update', () => {
    const r = UpdatePlanSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});

describe('HMAC token integrity (sanity)', () => {
  it('deterministic HMAC for same input', () => {
    const secret = 'test-secret-32-bytes-long-xxxxxxxx';
    const token = randomUUID();
    const a = createHmac('sha256', secret).update(token).digest('hex');
    const b = createHmac('sha256', secret).update(token).digest('hex');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('different secrets produce different HMACs', () => {
    const token = randomUUID();
    const a = createHmac('sha256', 'secret-a').update(token).digest('hex');
    const b = createHmac('sha256', 'secret-b').update(token).digest('hex');
    expect(a).not.toBe(b);
  });
});
