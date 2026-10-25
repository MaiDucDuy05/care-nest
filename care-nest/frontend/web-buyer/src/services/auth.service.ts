/**
 * Auth service — wraps auth API calls with demo accounts fallback.
 */
import { apiClient, AUTH_API, getToken, setToken, clearToken } from '../lib/api-client';
import {
  DEMO_ACCOUNTS,
  setCurrentDemoAccount,
  getCurrentDemoAccount,
  getWalletBalance,
} from '../lib/demo-accounts';

const BUYER_PORTAL_ROLES = ['BUYER', 'CAREGIVER', 'ELDER'] as const;
const WRONG_PORTAL_ERROR = 'Tài khoản này không có vai trò người mua hoặc người chăm sóc. Hãy đăng nhập từ đúng cổng.';

type AuthProfile = {
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

function makeDemoProfile(account: (typeof DEMO_ACCOUNTS)[number]) {
  const user = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    phone: account.phone,
    role: account.role,
  };

  return {
    ...user,
    user,
    shippingAddress: account.address,
    walletBalance: getWalletBalance(),
  };
}

export const authService = {
  async login(email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();
    const demoAcc = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === trimmedEmail && a.password === password
    );
    clearToken();

    let res: AuthResponse;
    try {
      res = await apiClient.auth.login({ email: trimmedEmail, password });
    } catch (err) {
      // Demo credentials are allowed offline only for buyer-side personas.
      if (demoAcc && isBuyerPortalRole(demoAcc.role)) {
        const mockToken = `demo_token_${demoAcc.role.toLowerCase()}_${Date.now()}`;
        setToken(mockToken);
        setCurrentDemoAccount(demoAcc);
        return {
          accessToken: mockToken,
          token: mockToken,
          user: {
            id: demoAcc.id,
            email: demoAcc.email,
            fullName: demoAcc.fullName,
            phone: demoAcc.phone,
            role: demoAcc.role,
          },
        };
      }
      throw err;
    }

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
    if (demoAcc && demoAcc.role === user.role) setCurrentDemoAccount(demoAcc);
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

    if (t.startsWith('demo_token_')) {
      const tokenRole = t.match(/^demo_token_([a-z]+)_/)?.[1]?.toUpperCase();
      const demoUser = getCurrentDemoAccount();
      if (demoUser && isBuyerPortalRole(demoUser.role) && tokenRole === demoUser.role) {
        return makeDemoProfile(demoUser);
      }
      clearToken();
      throw new Error(WRONG_PORTAL_ERROR);
    }

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
    const demoUser = getCurrentDemoAccount();
    const matchingDemo =
      demoUser &&
      demoUser.email.toLowerCase() === (user.email ?? '').toLowerCase() &&
      demoUser.role === user.role
        ? demoUser
        : null;

    return {
      ...response,
      ...user,
      user,
      shippingAddress: user.shippingAddress ?? matchingDemo?.address,
      walletBalance: user.walletBalance ?? (matchingDemo ? getWalletBalance() : undefined),
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
