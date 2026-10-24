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

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels: { email: true, sms: true, push: false, telegram: false },
  alertTypes: { sos: true, fall: true, vital: true, geofence: true, battery: true, billing: true },
};

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizePreferences(data: any): NotificationPreferences {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  // Check if it already has the frontend shape
  if (data.channels && data.alertTypes && typeof data.alertTypes === 'object') {
    return {
      channels: {
        email: Boolean(data.channels.email ?? true),
        sms: Boolean(data.channels.sms ?? true),
        push: Boolean(data.channels.push ?? false),
        telegram: Boolean(data.channels.telegram ?? false),
      },
      alertTypes: {
        sos: Boolean(data.alertTypes.sos ?? true),
        fall: Boolean(data.alertTypes.fall ?? true),
        vital: Boolean(data.alertTypes.vital ?? true),
        geofence: Boolean(data.alertTypes.geofence ?? true),
        battery: Boolean(data.alertTypes.battery ?? true),
        billing: Boolean(data.alertTypes.billing ?? true),
      },
    };
  }

  // Otherwise, data comes from backend notification-service:
  // { ALERT: { EMAIL: true, SMS: true, PUSH: true, ZNS: true }, ORDER: { ... } }
  const alertCat = data.ALERT || data.alert || {};

  let localAlertTypes = { ...DEFAULT_PREFERENCES.alertTypes };
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('carenest_alert_types');
      if (stored) {
        localAlertTypes = { ...localAlertTypes, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }

  const channels = {
    email: Boolean(alertCat.EMAIL ?? alertCat.email ?? true),
    sms: Boolean(alertCat.SMS ?? alertCat.sms ?? true),
    push: Boolean(alertCat.PUSH ?? alertCat.push ?? false),
    telegram: Boolean(alertCat.ZNS ?? alertCat.zns ?? false),
  };

  return {
    channels,
    alertTypes: localAlertTypes,
  };
}

export const notificationService = {
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const res = await fetch(`${NOTIFICATION_API}/api/v1/notifications/preferences`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return { ...DEFAULT_PREFERENCES };
      }
      const data = await res.json();
      return normalizePreferences(data);
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  },

  async updatePreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    const normalized = normalizePreferences(prefs);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carenest_alert_types', JSON.stringify(normalized.alertTypes));
      } catch {
        // ignore
      }
    }

    const backendPayload = {
      ALERT: {
        EMAIL: Boolean(normalized.channels.email),
        PUSH: Boolean(normalized.channels.push),
        SMS: Boolean(normalized.channels.sms),
        ZNS: Boolean(normalized.channels.telegram),
      },
      ORDER: {
        EMAIL: Boolean(normalized.channels.email),
        PUSH: Boolean(normalized.channels.push),
        SMS: Boolean(normalized.channels.sms),
        ZNS: Boolean(normalized.channels.telegram),
      },
      SUBSCRIPTION: {
        EMAIL: Boolean(normalized.channels.email),
        PUSH: Boolean(normalized.channels.push),
        SMS: Boolean(normalized.channels.sms),
        ZNS: Boolean(normalized.channels.telegram),
      },
      KYC: {
        EMAIL: Boolean(normalized.channels.email),
        PUSH: Boolean(normalized.channels.push),
        SMS: false,
        ZNS: false,
      },
    };

    try {
      await fetch(`${NOTIFICATION_API}/api/v1/notifications/preferences`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendPayload),
      });
    } catch (err) {
      console.warn('Backend preferences patch error:', err);
    }

    return normalized;
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
