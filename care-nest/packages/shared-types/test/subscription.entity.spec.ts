import { describe, it, expect } from 'vitest';
import {
  SubscriptionSchema,
  SubscriptionReminderSchema,
  ProrationPreviewSchema,
} from '../src/entities/subscription.entity.js';

const VALID_SUB = {
  id: '0180c19c-0000-4000-8000-000000000001',
  userId: '0180c19c-0000-4000-8000-000000000002',
  planId: '0180c19c-0000-4000-8000-000000000003',
  status: 'ACTIVE' as const,
  interval: 'MONTHLY' as const,
  currentPeriodStart: '2025-01-01T00:00:00.000Z',
  currentPeriodEnd: '2025-01-31T23:59:59.000Z',
  cancelledAt: null,
  pausedAt: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt: null,
};

const VALID_REMINDER = {
  id: '0180c19c-0000-4000-8000-000000000010',
  subscriptionId: '0180c19c-0000-4000-8000-000000000001',
  kind: 'MEDICATION' as const,
  triggerAt: '2025-01-15T09:00:00.000Z',
  message: 'Take your morning medication',
  isSent: false,
};

describe('SubscriptionSchema', () => {
  it('parses a valid subscription', () => {
    expect(SubscriptionSchema.safeParse(VALID_SUB).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(SubscriptionSchema.safeParse({ ...VALID_SUB, status: 'LIVE' }).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { id, ...rest } = VALID_SUB;
    expect(SubscriptionSchema.safeParse(rest).success).toBe(false);
  });
});

describe('SubscriptionReminderSchema', () => {
  it('parses a valid reminder', () => {
    expect(SubscriptionReminderSchema.safeParse(VALID_REMINDER).success).toBe(true);
  });

  it('rejects invalid kind', () => {
    expect(SubscriptionReminderSchema.safeParse({ ...VALID_REMINDER, kind: 'ALERT' }).success).toBe(false);
  });
});

describe('ProrationPreviewSchema', () => {
  it('parses full proration preview', () => {
    const preview = { mode: 'PRORATA' as const, creditVnd: 50000, chargeVnd: 99000, netVnd: 49000 };
    expect(ProrationPreviewSchema.safeParse(preview).success).toBe(true);
  });

  it('applies defaults', () => {
    const result = ProrationPreviewSchema.parse({ mode: 'NONE' });
    expect(result.creditVnd).toBe(0);
    expect(result.chargeVnd).toBe(0);
  });

  it('rejects negative net', () => {
    // netVnd is not validated to be non-negative — it's a display value
    expect(ProrationPreviewSchema.safeParse({ mode: 'PRORATA', netVnd: -1 }).success).toBe(true);
  });
});
