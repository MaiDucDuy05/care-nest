/**
 * Auth service — wraps auth API calls.
 */
import { apiClient, AUTH_API } from '../lib/api-client';

export const authService = {
  async login(email: string, password: string) {
    return apiClient.auth.login({ email, password });
  },

  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    return apiClient.auth.register(data);
  },

  async me(token: string) {
    return apiClient.auth.me(token);
  },

  getToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  },

  async logout() {
    // Clear cookie via server action or API call
    await fetch(`${AUTH_API}/api/v1/auth/logout`, { method: 'POST' });
  },
};
