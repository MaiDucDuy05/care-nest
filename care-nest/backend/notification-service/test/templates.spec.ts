import { describe, it, expect } from 'vitest';
import { renderTemplate, ALL_TEMPLATE_KEYS } from '../src/templates/templates.js';

describe('renderTemplate', () => {
  it('renders a simple variable substitution', () => {
    const r = renderTemplate('order.created', { orderNumber: 'CN-001', total: 100_000 });
    expect(r).not.toBeNull();
    expect(r!.subject).toContain('CN-001');
    expect(r!.body).toContain('CN-001');
  });

  it('renders the formatVnd helper', () => {
    const r = renderTemplate('order.created', { orderNumber: 'X', total: 1234567 });
    expect(r!.body).toContain('1.234.567 ₫');
  });

  it('handles missing optional vars gracefully', () => {
    const r = renderTemplate('order.cancelled', { orderNumber: 'CN-001' });
    expect(r).not.toBeNull();
    expect(r!.body).not.toContain('undefined');
  });

  it('renders conditional when reason provided', () => {
    const r = renderTemplate('order.cancelled', {
      orderNumber: 'CN-001',
      reason: 'hết hàng',
    });
    expect(r!.body).toContain('hết hàng');
  });

  it('omits conditional section when reason missing', () => {
    const r = renderTemplate('order.cancelled', { orderNumber: 'CN-001' });
    expect(r!.body).not.toContain('Lý do:');
  });

  it('returns null for unknown template', () => {
    expect(renderTemplate('does.not.exist', {})).toBeNull();
  });

  it('handles Handlebars escaping of HTML', () => {
    const r = renderTemplate('order.shipped', {
      orderNumber: '<script>alert(1)</script>',
      trackingCode: 'TRK-001',
    });
    // Handlebars escapes by default
    expect(r!.body).not.toContain('<script>');
  });

  it('renders the formatVnd helper with negative numbers', () => {
    const r = renderTemplate('order.created', { orderNumber: 'X', total: -50_000 });
    expect(r!.body).toContain('-50.000 ₫');
  });

  it('renders all template keys without errors', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      const r = renderTemplate(key, { orderNumber: 'X', trackingCode: 'T', reason: 'r', metric: 'hr', value: 1, battery: 20, occurredAt: 'now', userName: 'U', planName: 'P', amount: 100, nextPeriodEnd: '2026-04-01', currentPeriodEnd: '2026-03-15' });
      expect(r, `template ${key} should render`).not.toBeNull();
      expect(r!.subject.length).toBeGreaterThan(0);
      expect(r!.body.length).toBeGreaterThan(0);
    }
  });
});
