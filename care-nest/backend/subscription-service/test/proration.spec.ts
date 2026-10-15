import { describe, it, expect } from 'vitest';
import { calculateProration, formatVnd } from '../src/proration/proration.js';

const D = (s: string) => new Date(s);

describe('calculateProration', () => {
  describe('basic upgrade', () => {
    it('charges full difference for upgrade on day 1 of 30', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-03-01T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.isUpgrade).toBe(true);
      expect(r.periodDays).toBe(30);
      expect(r.daysRemaining).toBe(30);
      expect(r.fractionRemaining).toBe(1);
      expect(r.netCharge).toBe(200_000); // 300k cost - 100k credit
    });

    it('charges half for upgrade halfway through 30-day period', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-03-16T00:00:00Z'), // day 16 → 15 days left
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.daysRemaining).toBe(15);
      expect(r.netCharge).toBe(100_000); // 150k cost - 50k credit
    });
  });

  describe('basic downgrade', () => {
    it('returns negative net charge for downgrade (account credit)', () => {
      const r = calculateProration({
        currentPriceMonthly: 300_000,
        newPriceMonthly: 100_000,
        effectiveAt: D('2026-03-01T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.isDowngrade).toBe(true);
      expect(r.netCharge).toBe(-200_000);
    });

    it('downgrade on last day yields small credit', () => {
      const r = calculateProration({
        currentPriceMonthly: 300_000,
        newPriceMonthly: 100_000,
        effectiveAt: D('2026-03-30T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.daysRemaining).toBe(1);
      // 1/30 of (100k - 300k) = -6666.67 → rounded to -6667
      expect(r.netCharge).toBe(-6667);
    });
  });

  describe('edge cases', () => {
    it('zero charge when same price', () => {
      const r = calculateProration({
        currentPriceMonthly: 200_000,
        newPriceMonthly: 200_000,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.netCharge).toBe(0);
      expect(r.isUpgrade).toBe(false);
      expect(r.isDowngrade).toBe(false);
    });

    it('free-to-paid upgrade (current=0)', () => {
      const r = calculateProration({
        currentPriceMonthly: 0,
        newPriceMonthly: 100_000,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      // 16/30 of 100k = 53333 cost, 0 credit → 53333
      expect(r.netCharge).toBe(53_333);
    });

    it('paid-to-free downgrade (new=0)', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 0,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.netCharge).toBe(-53_333);
      expect(r.isDowngrade).toBe(true);
    });

    it('zero-length period returns 0 (defensive)', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-15T00:00:00Z'),
        currentPeriodEnd: D('2026-03-15T00:00:00Z'),
      });
      expect(r.netCharge).toBe(0);
      expect(r.periodDays).toBe(0);
    });

    it('effectiveAt in the past clamps daysRemaining to 0', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-02-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.daysRemaining).toBe(0);
      expect(r.netCharge).toBe(0);
    });

    it('effectiveAt = periodEnd returns 0', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-03-31T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.daysRemaining).toBe(0);
    });

    it('1-day period upgrade', () => {
      const r = calculateProration({
        currentPriceMonthly: 30_000,
        newPriceMonthly: 90_000,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-15T00:00:00Z'),
        currentPeriodEnd: D('2026-03-16T00:00:00Z'),
      });
      expect(r.periodDays).toBe(1);
      expect(r.daysRemaining).toBe(1);
      expect(r.netCharge).toBe(60_000);
    });

    it('28-day February period', () => {
      const r = calculateProration({
        currentPriceMonthly: 280_000,
        newPriceMonthly: 560_000,
        effectiveAt: D('2026-02-15T00:00:00Z'),
        currentPeriodStart: D('2026-02-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-01T00:00:00Z'),
      });
      expect(r.periodDays).toBe(28);
      expect(r.daysRemaining).toBe(14);
      // 14/28 = 0.5 → 140k credit, 280k cost → 140k charge
      expect(r.netCharge).toBe(140_000);
    });

    it('leap day 2024 (29-day February)', () => {
      const r = calculateProration({
        currentPriceMonthly: 290_000,
        newPriceMonthly: 580_000,
        effectiveAt: D('2024-02-15T00:00:00Z'),
        currentPeriodStart: D('2024-02-01T00:00:00Z'),
        currentPeriodEnd: D('2024-03-01T00:00:00Z'),
      });
      expect(r.periodDays).toBe(29);
      expect(r.daysRemaining).toBe(15);
    });

    it('cross-month rollover', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 200_000,
        effectiveAt: D('2026-01-15T00:00:00Z'),
        currentPeriodStart: D('2026-01-01T00:00:00Z'),
        currentPeriodEnd: D('2026-01-31T00:00:00Z'),
      });
      expect(r.periodDays).toBe(30);
      expect(r.daysRemaining).toBe(16);
    });

    it('fraction is rounded to 4 decimal places', () => {
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 200_000,
        effectiveAt: D('2026-03-08T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      // 23/30 = 0.7666... → 0.7667
      expect(r.fractionRemaining).toBe(0.7667);
    });

    it('large numbers stay within safe int', () => {
      const r = calculateProration({
        currentPriceMonthly: 50_000_000,
        newPriceMonthly: 100_000_000,
        effectiveAt: D('2026-03-16T00:00:00Z'), // 15 days left of 30
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      // 15/30 = 0.5 exactly. 50M * 0.5 = 25M credit, 100M * 0.5 = 50M cost → 25M charge
      expect(r.netCharge).toBe(25_000_000);
    });

    it('handles exact half correctly (no floating-point drift)', () => {
      const r = calculateProration({
        currentPriceMonthly: 200_000,
        newPriceMonthly: 400_000,
        effectiveAt: D('2026-03-16T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      // 15/30 = 0.5 exactly. 200k * 0.5 = 100k credit, 400k * 0.5 = 200k cost → 100k charge
      expect(r.netCharge).toBe(100_000);
    });

    it('rounding is half-up (banker-style would fail this)', () => {
      // 1/30 of 100000 = 3333.33... → half-up to 3333
      // 1/30 of 300000 = 10000.00 exact
      // 10000 - 3333 = 6667
      const r = calculateProration({
        currentPriceMonthly: 100_000,
        newPriceMonthly: 300_000,
        effectiveAt: D('2026-03-30T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.daysRemaining).toBe(1);
      expect(r.netCharge).toBe(6667);
    });

    it('negative net charge for downgrade is reported with isDowngrade=true', () => {
      const r = calculateProration({
        currentPriceMonthly: 500_000,
        newPriceMonthly: 200_000,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(r.netCharge).toBeLessThan(0);
      expect(r.isDowngrade).toBe(true);
      expect(r.isUpgrade).toBe(false);
    });

    it('isUpgrade and isDowngrade are mutually exclusive', () => {
      const up = calculateProration({
        currentPriceMonthly: 100, newPriceMonthly: 200,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      const down = calculateProration({
        currentPriceMonthly: 200, newPriceMonthly: 100,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(up.isUpgrade).toBe(true);
      expect(up.isDowngrade).toBe(false);
      expect(down.isUpgrade).toBe(false);
      expect(down.isDowngrade).toBe(true);
    });

    it('returns whole-number VND (no decimals)', () => {
      const r = calculateProration({
        currentPriceMonthly: 99_999,
        newPriceMonthly: 299_999,
        effectiveAt: D('2026-03-15T00:00:00Z'),
        currentPeriodStart: D('2026-03-01T00:00:00Z'),
        currentPeriodEnd: D('2026-03-31T00:00:00Z'),
      });
      expect(Number.isInteger(r.netCharge)).toBe(true);
    });
  });
});

describe('formatVnd', () => {
  it('formats positive amounts with Vietnamese thousands separator', () => {
    expect(formatVnd(1_250_000)).toBe('1.250.000 ₫');
  });

  it('formats zero', () => {
    expect(formatVnd(0)).toBe('0 ₫');
  });

  it('formats negative amounts with leading minus', () => {
    expect(formatVnd(-50_000)).toBe('-50.000 ₫');
  });

  it('formats small amounts', () => {
    expect(formatVnd(500)).toBe('500 ₫');
  });

  it('formats millions with all separators', () => {
    expect(formatVnd(1_234_567_890)).toBe('1.234.567.890 ₫');
  });
});
