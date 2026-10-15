/**
 * Auth service. In dev, no backend may be running — we keep the contract
 * honest but accept mock auth on the dev-mode flag.
 */

import { AUTH_API, apiFetch, setToken, clearToken, getToken } from '../api-client';
import type { SellerProfile } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_SELLER: SellerProfile = {
  id: 'seller-mock-1',
  email: 'demo.seller@carenest.vn',
  fullName: 'Nguyễn Văn A',
  phone: '+84 901 234 567',
  role: 'SELLER',
  kycStatus: 'NOT_STARTED',
  storeName: 'Cửa hàng Demo',
  storeSlug: 'demo-store',
  description: 'Cửa hàng thiết bị y tế demo',
  createdAt: new Date().toISOString(),
};

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; seller: SellerProfile }> {
    if (USE_MOCK) {
      const token = 'mock.' + btoa(email + ':' + Date.now());
      setToken(token);
      return { token, seller: { ...MOCK_SELLER, email } };
    }
    const data = await apiFetch<{ accessToken: string; seller: SellerProfile }>(
      `${AUTH_API}/api/v1/auth/login`,
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(data.accessToken);
    return { token: data.accessToken, seller: data.seller };
  },

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): Promise<{ token: string; seller: SellerProfile }> {
    if (USE_MOCK) {
      const token = 'mock.' + btoa(input.email + ':' + Date.now());
      setToken(token);
      return { token, seller: { ...MOCK_SELLER, ...input } };
    }
    const data = await apiFetch<{ accessToken: string; seller: SellerProfile }>(
      `${AUTH_API}/api/v1/auth/register`,
      { method: 'POST', body: JSON.stringify({ ...input, role: 'SELLER' }) }
    );
    setToken(data.accessToken);
    return { token: data.accessToken, seller: data.seller };
  },

  async me(): Promise<SellerProfile> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    if (USE_MOCK) return MOCK_SELLER;
    return apiFetch<SellerProfile>(`${AUTH_API}/api/v1/auth/me`, { token });
  },

  logout(): void {
    clearToken();
  },
};
