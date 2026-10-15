/**
 * Notification preferences service.
 */
import { NOTIFICATION_API } from '../lib/api-client';

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

export const notificationService = {
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/preferences`);
    if (!res.ok) {
      if (res.status === 404) {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listNotifications(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications?${query.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async subscribePush(subscription: PushSubscriptionJSON) {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/push-subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async unsubscribePush(endpoint: string) {
    const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/push-subscriptions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
