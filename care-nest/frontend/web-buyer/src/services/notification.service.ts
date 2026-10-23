/**
 * Notification preferences service.
 */
import { NOTIFICATION_API, getToken } from '../lib/api-client';

export interface NotificationPreferences {
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    telegram: boolean;
  };
  alertTypes: {
    sos: boolean;
    fall: boolean;
    vital: boolean;
    geofence: boolean;
    battery: boolean;
    billing: boolean;
  };
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const notificationService = {
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/preferences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 401) {
        return {
          channels: { email: true, sms: true, push: false, telegram: false },
          alertTypes: { sos: true, fall: true, vital: true, geofence: true, battery: true, billing: true },
        };
      }
      throw new Error(await res.text());
    }
    return res.json();
  },

  async updatePreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listNotifications(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async subscribePush(subscription: PushSubscriptionJSON) {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/push-subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subscription }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async unsubscribePush(endpoint: string) {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/push-subscriptions`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
