/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Subscription service — plan management and billing.
 */
import { apiClient, SUBSCRIPTION_API, getToken } from '../lib/api-client';

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amountVnd: number;
  method: string;
  status: string;
  paidAt: string;
  invoiceUrl?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const subscriptionsService = {
  async getMySubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 401) return null;
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
      headers: getAuthHeaders(),
      body: JSON.stringify({ fromPlanId, toPlanId, effectiveAt: effectiveAt ?? new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async switchPlan(toPlanId: string) {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/switch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ toPlanId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listPayments() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/payments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 401) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async pauseSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reactivateSubscription() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/me/reactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
