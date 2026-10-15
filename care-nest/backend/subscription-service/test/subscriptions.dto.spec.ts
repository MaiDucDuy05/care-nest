import { describe, it, expect } from 'vitest';
import {
  CreateSubscriptionSchema,
  ChangePlanSchema,
  CancelSubscriptionSchema,
} from '../src/subscriptions/dto/subscriptions.dto.js';

describe('CreateSubscriptionSchema', () => {
  it('accepts minimal valid input', () => {
    const r = CreateSubscriptionSchema.safeParse({ planCode: 'basic' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.trialDays).toBe(0);
    }
  });

  it('rejects empty planCode', () => {
    const r = CreateSubscriptionSchema.safeParse({ planCode: '' });
    expect(r.success).toBe(false);
  });

  it('coerces ISO string to Date', () => {
    const r = CreateSubscriptionSchema.safeParse({
      planCode: 'basic',
      startAt: '2026-03-15T00:00:00Z',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.startAt).toBeInstanceOf(Date);
    }
  });

  it('rejects trialDays > 60', () => {
    const r = CreateSubscriptionSchema.safeParse({ planCode: 'basic', trialDays: 100 });
    expect(r.success).toBe(false);
  });

  it('accepts free-form metadata', () => {
    const r = CreateSubscriptionSchema.safeParse({
      planCode: 'basic',
      metadata: { source: 'web', promo: 'SPRING2026', referrer: 'partner1' },
    });
    expect(r.success).toBe(true);
  });
});

describe('ChangePlanSchema', () => {
  it('requires newPlanCode', () => {
    const r = ChangePlanSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('coerces effectiveAt string', () => {
    const r = ChangePlanSchema.safeParse({
      newPlanCode: 'family',
      effectiveAt: '2026-04-01T00:00:00Z',
    });
    expect(r.success).toBe(true);
  });
});

describe('CancelSubscriptionSchema', () => {
  it('defaults to deferred cancellation', () => {
    const r = CancelSubscriptionSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.immediate).toBe(false);
  });

  it('accepts immediate flag', () => {
    const r = CancelSubscriptionSchema.safeParse({ immediate: true, reason: 'too expensive' });
    expect(r.success).toBe(true);
  });

  it('rejects reason over 500 chars', () => {
    const r = CancelSubscriptionSchema.safeParse({ reason: 'x'.repeat(501) });
    expect(r.success).toBe(false);
  });
});
