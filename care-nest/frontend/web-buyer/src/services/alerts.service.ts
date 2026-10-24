/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Alerts service — alert history.
 */
import { ALERT_API, getToken } from '../lib/api-client';

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const alertsService = {
  async listAlerts(params?: { subjectId?: string; limit?: number; page?: number; pageSize?: number; from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.limit) {
      query.set('pageSize', params.limit.toString());
      query.set('limit', params.limit.toString());
    }
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const res = await fetch(`${ALERT_API}/api/v1/alerts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) return { items: [], total: 0 };
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

  async updateStatus(id: string, status: 'ACKNOWLEDGED' | 'RESOLVED' | 'CLOSED_FALSE', notes?: string) {
    const res = await fetch(`${ALERT_API}/api/v1/alerts/${id}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
