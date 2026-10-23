/**
 * Auth service — wraps auth API calls.
 */
import { apiClient, AUTH_API, getToken, setToken, clearToken } from '../lib/api-client';

export const authService = {
  async login(email: string, password: string) {
    const res = await apiClient.auth.login({ email, password });
    if (res?.accessToken) {
      setToken(res.accessToken);
    } else if (res?.token) {
      setToken(res.token);
    }
    return res;
  },

  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const res = await apiClient.auth.register(data);
    if (res?.accessToken) {
      setToken(res.accessToken);
    } else if (res?.token) {
      setToken(res.token);
    }
    return res;
  },

  async me(token?: string) {
    const t = token || getToken();
    if (!t) throw new Error('Not authenticated');
    return apiClient.auth.me(t);
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
