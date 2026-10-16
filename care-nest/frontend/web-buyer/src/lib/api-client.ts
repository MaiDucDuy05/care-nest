/**
 * CareNest API Client
 * Wraps HTTP calls to the backend microservices.
 */

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
const CATALOG_API = process.env.NEXT_PUBLIC_CATALOG_API_URL || 'http://localhost:3002';
const DEVICE_API = process.env.NEXT_PUBLIC_DEVICE_API_URL || 'http://localhost:3003';
const ORDER_API = process.env.NEXT_PUBLIC_ORDER_API_URL || 'http://localhost:3003';
const PAYMENT_API = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:3005';
const ALERT_API = process.env.NEXT_PUBLIC_ALERT_API_URL || 'http://localhost:3007';
const SUBSCRIPTION_API = process.env.NEXT_PUBLIC_SUBSCRIPTION_API_URL || 'http://localhost:3008';
const SHIPPING_API = process.env.NEXT_PUBLIC_SHIPPING_API_URL || 'http://localhost:3009';
const NOTIFICATION_API = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:3006';
// Activation codes are issued and redeemed by device-service (S16).
const ACTIVATION_API = process.env.NEXT_PUBLIC_DEVICE_API_URL || 'http://localhost:3003';

export const apiClient = {
  auth: {
    async login(credentials: { email: string; password: string }) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async register(data: { email: string; password: string; fullName: string; phone?: string }) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async me(token: string) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  catalog: {
    async getProducts(params?: { categoryId?: string; search?: string; page?: number }) {
      const query = new URLSearchParams();
      if (params?.categoryId) query.set('categoryId', params.categoryId);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());

      const res = await fetch(`${CATALOG_API}/api/v1/products?${query.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async getProduct(id: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/products/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },

  devices: {
    async getDevices() {
      const res = await fetch(`${DEVICE_API}/api/v1/devices`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async getDevice(id: string) {
      const res = await fetch(`${DEVICE_API}/api/v1/devices/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async getLatestVitals(deviceId: string) {
      const res = await fetch(`${DEVICE_API}/api/v1/devices/${deviceId}/telemetry/latest`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async getTelemetryHistory(deviceId: string, params?: { from?: string; to?: string; limit?: number }) {
      const query = new URLSearchParams();
      if (params?.from) query.set('from', params.from);
      if (params?.to) query.set('to', params.to);
      if (params?.limit) query.set('limit', params.limit.toString());

      const res = await fetch(`${DEVICE_API}/api/v1/devices/${deviceId}/telemetry?${query.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    async getMyDevices() {
      const res = await fetch(`${DEVICE_API}/api/v1/devices/me`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  },
};

export { AUTH_API, CATALOG_API, DEVICE_API, ORDER_API, PAYMENT_API, ALERT_API, SUBSCRIPTION_API, SHIPPING_API, NOTIFICATION_API, ACTIVATION_API };

/**
 * Read the buyer auth token from localStorage. Web-buyer stores the
 * token issued by /auth/login under this key.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('buyer_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('buyer_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('buyer_token');
}
