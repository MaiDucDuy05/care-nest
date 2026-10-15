import { describe, it, expect } from 'vitest';
import { UpdateAlertStatusSchema } from '../src/alerts/dto/alert.dto.js';

describe('UpdateAlertStatusSchema', () => {
  it('accepts valid status', () => {
    const r = UpdateAlertStatusSchema.safeParse({ status: 'ACKNOWLEDGED' });
    expect(r.success).toBe(true);
  });

  it('accepts RESOLVED with notes', () => {
    const r = UpdateAlertStatusSchema.safeParse({ status: 'RESOLVED', notes: 'subject recovered' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe('subject recovered');
  });

  it('rejects unknown status', () => {
    const r = UpdateAlertStatusSchema.safeParse({ status: 'INVALID' });
    expect(r.success).toBe(false);
  });

  it('rejects notes > 500 chars', () => {
    const r = UpdateAlertStatusSchema.safeParse({ status: 'ACKNOWLEDGED', notes: 'x'.repeat(501) });
    expect(r.success).toBe(false);
  });
});
