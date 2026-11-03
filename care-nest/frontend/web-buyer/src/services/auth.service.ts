/**
 * Buyer Auth service — communicates directly with auth API.
 */
import { apiClient, AUTH_API, getToken, setToken, clearToken } from '../lib/api-client';

const BUYER_PORTAL_ROLES = ['BUYER', 'CAREGIVER', 'ELDER'] as const;
const WRONG_PORTAL_ERROR = 'Tài khoản này không có vai trò người mua hoặc người chăm sóc. Hãy đăng nhập từ đúng cổng.';

export type AuthProfile = {
  id?: string;
  sub?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  shippingAddress?: {
    addressLine?: string;
    line1?: string;
    ward?: string;
    district?: string;
    city?: string;
    [key: string]: unknown;
  };
  walletBalance?: number;
  [key: string]: unknown;
};

type AuthResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthProfile;
  data?: { user?: AuthProfile };
};

export function isBuyerPortalRole(role: unknown): role is (typeof BUYER_PORTAL_ROLES)[number] {
  return typeof role === 'string' && BUYER_PORTAL_ROLES.includes(role as (typeof BUYER_PORTAL_ROLES)[number]);
}

export const authService = {
  async login(email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();
    clearToken();

    const res: AuthResponse = await apiClient.auth.login({ email: trimmedEmail, password });
    const user = res.user ?? res.data?.user;
    if (!user || !isBuyerPortalRole(user.role)) {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }

    const token = res?.accessToken ?? res?.token;
    if (!token) {
      clearToken();
      throw new Error('Máy chủ không trả về access token.');
    }
    setToken(token);
    return res;
  },

  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const res = await apiClient.auth.register(data);
    const user = (res?.user ?? res?.data?.user) as AuthProfile | undefined;
    if (!user || !isBuyerPortalRole(user.role)) {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }
    const token = res?.accessToken ?? res?.token;
    if (!token) throw new Error('Máy chủ không trả về access token.');
    setToken(token);
    return res;
  },

  async me(token?: string) {
    const t = token || getToken();
    if (!t) throw new Error('Not authenticated');

    const response = (await apiClient.auth.me(t)) as { user?: AuthProfile } & AuthProfile;
    const apiUser = response.user ?? response;
    if (!isBuyerPortalRole(apiUser.role)) {
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }

    const user = {
      ...apiUser,
      id: apiUser.id ?? apiUser.sub ?? apiUser.userId,
    };

    return {
      ...response,
      ...user,
      user,
    };
  },

  getToken(): string | null {
    return getToken();
  },

  async logout() {
    clearToken();
    try {
      await fetch(`${AUTH_API}/api/v1/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
  },
};
