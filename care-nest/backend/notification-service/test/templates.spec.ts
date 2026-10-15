import { describe, it, expect } from 'vitest';
import { renderTemplate, ALL_TEMPLATE_KEYS } from '../src/templates/templates.js';

describe('templates', () => {
  it('renders order.created with orderNumber and total', () => {
    const t = renderTemplate('order.created', { orderNumber: 'CN-001', total: 100000 });
    expect(t).not.toBeNull();
    expect(t!.subject).toContain('CN-001');
    expect(t!.body).toContain('100000');
  });

  it('renders alert.sos with userName and occurredAt', () => {
    const t = renderTemplate('alert.sos', { userName: 'Ba', occurredAt: '10:30' });
    expect(t!.subject).toContain('🚨');
    expect(t!.body).toContain('Ba');
  });

  it('returns null for unknown template', () => {
    expect(renderTemplate('not.a.template', {})).toBeNull();
  });

  it('has at least the 11 documented template keys', () => {
    expect(ALL_TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(11);
    expect(ALL_TEMPLATE_KEYS).toContain('order.created');
    expect(ALL_TEMPLATE_KEYS).toContain('kyc.approved');
    expect(ALL_TEMPLATE_KEYS).toContain('alert.sos');
  });
});
