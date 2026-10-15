/**
 * Client-side proration helper.
 * Estimates billing amounts for plan switching.
 * Server is source of truth — this is for UI preview only.
 */

export interface Plan {
  id: string;
  name: string;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  priceVnd: number;
}

export interface ProrationEstimate {
  creditVnd: number;
  chargeVnd: number;
  netVnd: number;
  daysRemaining: number;
  totalDays: number;
  isImmediate: boolean;
}

const DAYS_PER_INTERVAL: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  YEARLY: 365,
};

export function estimateProration(
  currentPlan: Plan,
  newPlan: Plan,
  periodEnd: Date,
  isUpgrade: boolean
): ProrationEstimate {
  const now = new Date();
  const msRemaining = periodEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const totalDays = DAYS_PER_INTERVAL[currentPlan.interval] ?? 30;

  // Credit: unused days on current plan
  const creditRatio = daysRemaining / totalDays;
  const creditVnd = Math.round(currentPlan.priceVnd * creditRatio);

  // Charge: prorated cost of new plan for remaining days
  const newTotalDays = DAYS_PER_INTERVAL[newPlan.interval] ?? 30;
  const chargeRatio = daysRemaining / newTotalDays;
  const chargeVnd = Math.round(newPlan.priceVnd * chargeRatio);

  const netVnd = isUpgrade ? chargeVnd - creditVnd : 0;

  return {
    creditVnd,
    chargeVnd,
    netVnd: Math.max(0, netVnd),
    daysRemaining,
    totalDays,
    isImmediate: isUpgrade,
  };
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
