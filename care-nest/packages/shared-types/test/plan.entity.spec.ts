import { describe, it, expect } from 'vitest';
import { PlanSchema } from '../src/entities/plan.entity.js';

const VALID_PLAN = {
  id: '0180c19c-0000-4000-8000-000000000001',
  name: 'Basic Care',
  description: 'Basic care plan',
  interval: 'MONTHLY' as const,
  priceVnd: 99000,
  deviceSlots: 2,
  features: ['heart_rate', 'location'],
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('PlanSchema', () => {
  it('parses a valid plan', () => {
    const result = PlanSchema.safeParse(VALID_PLAN);
    expect(result.success).toBe(true);
  });

  it('uses defaults for optional fields', () => {
    const { description, deviceSlots, features, isActive, ...minimal } = VALID_PLAN;
    const result = PlanSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.features).toEqual([]);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects negative price', () => {
    const result = PlanSchema.safeParse({ ...VALID_PLAN, priceVnd: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid interval', () => {
    const result = PlanSchema.safeParse({ ...VALID_PLAN, interval: 'WEEKLY' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid ID format', () => {
    const result = PlanSchema.safeParse({ ...VALID_PLAN, id: 'not-a-cuid-or-uuid' });
    expect(result.success).toBe(false);
  });
});
