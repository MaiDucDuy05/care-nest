/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Alerts service — alert history.
 */
import { apiClient, ALERT_API } from '../lib/api-client';

export const alertsService = {
  async listAlerts(params?: { subjectId?: string; limit?: number; from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const res = await fetch(`${ALERT_API}/api/v1/alerts?${query.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAlert(id: string) {
    const res = await fetch(`${ALERT_API}/api/v1/alerts/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
