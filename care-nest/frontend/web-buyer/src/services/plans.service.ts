/**
 * Plans service — list available plans and fetch by id.
 */
import type { Plan } from '@carenest/shared-types';
import { SUBSCRIPTION_API } from '../lib/api-client';

export const plansService = {
  async getPlans(): Promise<Plan[]> {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/plans`);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Plan[]>;
  },

  async getById(planId: string): Promise<Plan> {
    // The plan detail endpoint is not always exposed; we fall back to a
    // list-then-find which works as long as GET /plans returns the full
    // set. If the backend later adds a dedicated GET /plans/:id endpoint,
    // swap the URL here.
    const all = await this.getPlans();
    const found = all.find((p) => p.id === planId);
    if (!found) throw new Error(`plan not found: ${planId}`);
    return found;
  },
};


