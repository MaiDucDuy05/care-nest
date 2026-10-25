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

type AuthUser = {
  id?: string;
  sub?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
};

type AuthResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  seller?: AuthUser;
};

const MOCK_SELLER_EMAILS = new Set(
  [
    MOCK_SELLER.email,
    'seller.wonlex@carenest.vn',
    'seller.medtech@carenest.vn',
    process.env.NEXT_PUBLIC_MOCK_SELLER_EMAIL,
  ]
    .filter((email): email is string => Boolean(email))
    .map((email) => email.trim().toLowerCase())
);
const MOCK_SELLER_PASSWORD = process.env.NEXT_PUBLIC_MOCK_SELLER_PASSWORD || 'Seller@123456';
const WRONG_PORTAL_ERROR = 'Tài khoản này không có vai trò người bán. Hãy đăng nhập từ đúng cổng.';

function toSellerProfile(user: AuthUser): SellerProfile {
  return {
    ...MOCK_SELLER,
    ...user,
    id: user.id ?? user.sub ?? user.userId ?? MOCK_SELLER.id,
    email: user.email ?? MOCK_SELLER.email,
    fullName: user.fullName ?? user.email ?? MOCK_SELLER.fullName,
    phone: user.phone ?? MOCK_SELLER.phone,
    role: 'SELLER',
  } as SellerProfile;
}

export const authService = {
  async login(email: string, password: string): Promise<void> {
    clearToken();
    const normalizedEmail = email.trim().toLowerCase();

    if (USE_MOCK) {
      if (!MOCK_SELLER_EMAILS.has(normalizedEmail) || password !== MOCK_SELLER_PASSWORD) {
        throw new Error('Thông tin đăng nhập demo người bán không đúng.');
      }
      const token = 'mock.seller.' + btoa(normalizedEmail + ':' + Date.now());
      setToken(token);
      return;
    }

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
    if (USE_MOCK) {
      const token = 'mock.seller.' + btoa(input.email.trim().toLowerCase() + ':' + Date.now());
      setToken(token);
      return { token, seller: { ...MOCK_SELLER, ...input } };
    }
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
    if (USE_MOCK) {
      if (!token.startsWith('mock.seller.')) {
        clearToken();
        throw new Error(WRONG_PORTAL_ERROR);
      }
      return MOCK_SELLER;
    }

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
