/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Alerts service — alert history.
 */
import { apiClient, ALERT_API, getToken } from '../lib/api-client';

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const alertsService = {
  async listAlerts(params?: { subjectId?: string; limit?: number; from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const res = await fetch(`${ALERT_API}/api/v1/alerts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  async getAlert(id: string) {
    const res = await fetch(`${ALERT_API}/api/v1/alerts/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
