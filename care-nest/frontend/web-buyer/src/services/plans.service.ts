/**
 * Plans service — list available plans.
 */
import { SUBSCRIPTION_API } from '../lib/api-client';

export const plansService = {
  async getPlans() {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/plans`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
