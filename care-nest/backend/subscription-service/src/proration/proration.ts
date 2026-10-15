/**
 * Proration calculator — pure function, no I/O, no Prisma, no Nest.
 *
 * Used in two flows:
 *  1. Mid-cycle UPGRADE: customer pays the difference for the unused portion
 *     of the old plan, credited against the new plan's price.
 *  2. Mid-cycle DOWNGRADE: we issue account credit for the unused portion
 *     of the current plan (refunded at next renewal, never pro-rated to cash).
 *
 * All money is in VND integers (no decimals — `Decimal(12,0)` in schema).
 * All math uses bigint via Number — VND amounts fit safely in JS number
 * (max safe int = 9e15, our caps are around 1e9 for a single subscription).
 *
 * Edge cases (20+ test cases in `proration.spec.ts`):
 *  - same day, future-dated change, expired sub, paused sub, free plan,
 *    same plan, downgrade to free, 0-day period, 1-day period,
 *    30-day period, leap day, 31st of month, month-end rollover,
 *    negative result (impossible — we clamp to 0), rounding, etc.
 */

export interface ProrationInput {
  /** Current plan's monthly price in VND. */
  currentPriceMonthly: number;
  /** Target plan's monthly price in VND. */
  newPriceMonthly: number;
  /** ISO date the change takes effect. */
  effectiveAt: Date;
  /** Current period start (inclusive). */
  currentPeriodStart: Date;
  /** Current period end (exclusive). */
  currentPeriodEnd: Date;
}

export interface ProrationResult {
  /** Positive = customer owes us. Negative = we owe customer credit. 0 = no change. */
  netCharge: number;
  /** Days remaining in current period (from effectiveAt, inclusive of today). */
  daysRemaining: number;
  /** Total days in current period. */
  periodDays: number;
  /** Fraction of the period remaining, rounded to 4 decimal places. */
  fractionRemaining: number;
  /** True when this is a downgrade (new < current). */
  isDowngrade: boolean;
  /** True when this is an upgrade (new > current). */
  isUpgrade: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Inclusive day count between two dates, floored. We use calendar days (not
 * 86400s) so DST transitions don't shift the math. Both dates are interpreted
 * in UTC to match how we store periods in Postgres.
 */
function diffDays(a: Date, b: Date): number {
  // Normalize to UTC midnight to avoid timezone/DST drift
  const aMid = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bMid = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bMid - aMid) / MS_PER_DAY);
}

function roundHalfUp(n: number): number {
  return Math.sign(n) * Math.floor(Math.abs(n) + 0.5);
}

export function calculateProration(input: ProrationInput): ProrationResult {
  const {
    currentPriceMonthly,
    newPriceMonthly,
    effectiveAt,
    currentPeriodStart,
    currentPeriodEnd,
  } = input;

  const periodDays = diffDays(currentPeriodStart, currentPeriodEnd);
  // Clamp daysRemaining to 0 if effectiveAt is outside the period. This is
  // a defensive guard against bad client input (e.g. back-dated import) —
  // we refuse to charge or credit for an out-of-range change.
  const rawRemaining = diffDays(effectiveAt, currentPeriodEnd);
  const daysRemaining = Math.max(0, rawRemaining);
  // diffDays(periodStart, effectiveAt) is positive when effectiveAt is
  // after periodStart. So `beforeStart` is true exactly when the change
  // was requested before the period even started.
  const beforeStart = diffDays(currentPeriodStart, effectiveAt) < 0;
  const safeDaysRemaining = beforeStart ? 0 : daysRemaining;

  // Defensive: zero-length period => nothing to prorate
  if (periodDays <= 0) {
    return {
      netCharge: 0,
      daysRemaining: 0,
      periodDays: 0,
      fractionRemaining: 0,
      isDowngrade: newPriceMonthly < currentPriceMonthly,
      isUpgrade: newPriceMonthly > currentPriceMonthly,
    };
  }

  // Compute the raw fraction for the actual money math, then round the
  // display value separately. Rounding the fraction first compounds the
  // error (e.g. 1/30 → 0.0333 would lose 333 VND on a 100k plan).
  const rawFraction = periodDays > 0 ? safeDaysRemaining / periodDays : 0;
  const fractionRemaining = roundHalfUp(rawFraction * 10000) / 10000;

  // Credit for unused portion of CURRENT plan (VND, rounded to nearest dong)
  const credit = roundHalfUp(currentPriceMonthly * rawFraction);
  // Cost for unused portion of NEW plan
  const cost = roundHalfUp(newPriceMonthly * rawFraction);

  // netCharge = what customer owes for the upgrade (or credit on downgrade)
  //   Upgrade: cost_new - credit_old (positive => charge)
  //   Downgrade: credit_old - cost_new (negative => credit on account)
  //   Same plan: 0
  const netCharge = cost - credit;

  return {
    netCharge,
    daysRemaining: safeDaysRemaining,
    periodDays,
    fractionRemaining,
    isDowngrade: newPriceMonthly < currentPriceMonthly,
    isUpgrade: newPriceMonthly > currentPriceMonthly,
  };
}

/**
 * Format a VND amount as a human-readable string (1.250.000 ₫). Used in
 * notification templates and API responses.
 */
export function formatVnd(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${s} ₫`;
}
