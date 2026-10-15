/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Subscription service — plan management and billing.
 */
import { apiClient, SUBSCRIPTION_API } from '../lib/api-client';

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amountVnd: number;
  method: string;
  status: string;
  paidAt: string;
  invoiceUrl?: string;
}

export const subscriptionsService = {
  async getMySubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(await res.text());
    }
    return res.json();
  },

  async getPlans() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/plans`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async previewProration(fromPlanId: string, toPlanId: string, effectiveAt?: string) {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/preview-proration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPlanId, toPlanId, effectiveAt: effectiveAt ?? new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async switchPlan(toPlanId: string) {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toPlanId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listPayments() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/payments`);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async pauseSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/pause`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reactivateSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/reactivate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
