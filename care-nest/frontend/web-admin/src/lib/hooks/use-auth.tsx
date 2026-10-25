'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient, type AuthUser } from '@/lib/api-client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'admin_token';
const ADMIN_ROLES: string[] = ['ADMIN', 'SUPPORT', 'MEDICAL_REVIEWER'];

function hasAdminRole(role?: string): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      apiClient.auth
        .me(stored)
        .then((u) => {
          if (!hasAdminRole(u.role)) {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
            return;
          }
          setToken(stored);
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);

    const response = await apiClient.auth.login({ email, password });
    if (!hasAdminRole(response.user?.role)) {
      throw new Error('Tài khoản này không có quyền truy cập cổng quản trị.');
    }

    const authToken = response.accessToken ?? response.token;
    if (!authToken) throw new Error('Máy chủ không trả về access token.');
    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT' || user?.role === 'MEDICAL_REVIEWER';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
