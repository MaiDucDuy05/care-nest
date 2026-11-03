import { ORDER_API, apiFetch, getToken } from '../api-client';
import type { AnalyticsSummary } from '../types';

export const analyticsService = {
  async summary(days = 7): Promise<AnalyticsSummary> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<AnalyticsSummary>(`${ORDER_API}/api/v1/analytics?days=${days}`, { token });
  },
};
