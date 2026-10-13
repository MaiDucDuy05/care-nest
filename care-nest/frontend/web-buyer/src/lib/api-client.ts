/**
 * CareNest API Client
 * Wraps HTTP calls to the backend microservices.
 */

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
const CATALOG_API = process.env.NEXT_PUBLIC_CATALOG_API_URL || 'http://localhost:3002';
const DEVICE_API = process.env.NEXT_PUBLIC_DEVICE_API_URL || 'http://localhost:3003';

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
  },
};
