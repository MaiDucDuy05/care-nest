/**
 * Seller Auth service. Directly communicates with Auth API.
 */

import { AUTH_API, apiFetch, setToken, clearToken, getToken } from '../api-client';
import type { SellerProfile } from '../types';

type AuthUser = {
  id?: string;
  sub?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  kycStatus?: string;
  storeName?: string;
  storeSlug?: string;
  description?: string;
  createdAt?: string;
  [key: string]: unknown;
};

type AuthResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  seller?: AuthUser;
};

const WRONG_PORTAL_ERROR = 'Tài khoản này không có vai trò người bán. Hãy đăng nhập từ đúng cổng.';

function toSellerProfile(user: AuthUser): SellerProfile {
  return {
    id: user.id ?? user.sub ?? user.userId ?? '',
    email: user.email ?? '',
    fullName: user.fullName ?? user.email ?? '',
    phone: user.phone ?? '',
    role: 'SELLER',
    kycStatus: (user.kycStatus as any) ?? 'NOT_STARTED',
    storeName: (user.storeName as string) ?? '',
    storeSlug: (user.storeSlug as string) ?? '',
    description: (user.description as string) ?? '',
    createdAt: (user.createdAt as string) ?? new Date().toISOString(),
  } as SellerProfile;
}

export const authService = {
  async login(email: string, password: string): Promise<void> {
    clearToken();

    const data = await apiFetch<AuthResponse>(
      `${AUTH_API}/api/v1/auth/login`,
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    const user = data.user ?? data.seller;
    if (user?.role !== 'SELLER') {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }

    const token = data.accessToken ?? data.token;
    if (!token) throw new Error('Máy chủ không trả về access token.');
    setToken(token);
  },

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): Promise<{ token: string; seller: SellerProfile }> {
    const data = await apiFetch<AuthResponse>(
      `${AUTH_API}/api/v1/auth/register`,
      { method: 'POST', body: JSON.stringify({ ...input, role: 'SELLER' }) }
    );
    const user = data.user ?? data.seller;
    if (user?.role !== 'SELLER') {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }
    const token = data.accessToken ?? data.token;
    if (!token) throw new Error('Máy chủ không trả về access token.');
    setToken(token);
    return { token, seller: toSellerProfile(user) };
  },

  async me(): Promise<SellerProfile> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');

    const data = await apiFetch<{ user?: AuthUser } & AuthUser>(`${AUTH_API}/api/v1/auth/me`, { token });
    const user = data.user ?? data;
    if (user.role !== 'SELLER') {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }
    return toSellerProfile(user);
  },

  logout(): void {
    clearToken();
  },
};
