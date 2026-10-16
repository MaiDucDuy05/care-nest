/**
 * Seller-side API client base. Reads NEXT_PUBLIC_API_GATEWAY_URL if present,
 * else falls back to the per-service URLs in dev.
 *
 * Per-service ports (dev defaults match docker-compose):
 *   - AUTH:     3001
 *   - CATALOG:  3002
 *   - ORDER:    3003
 *   - PAYMENT:  3005
 *   - SHIPPING: 3009
 */

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

const AUTH_API = API_GATEWAY || process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
const CATALOG_API = API_GATEWAY || process.env.NEXT_PUBLIC_CATALOG_API_URL || 'http://localhost:3002';
const ORDER_API = API_GATEWAY || process.env.NEXT_PUBLIC_ORDER_API_URL || 'http://localhost:3004';
const PAYMENT_API = API_GATEWAY || process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:3005';
const SHIPPING_API = API_GATEWAY || process.env.NEXT_PUBLIC_SHIPPING_API_URL || 'http://localhost:3009';


export { AUTH_API, CATALOG_API, ORDER_API, PAYMENT_API, SHIPPING_API, API_GATEWAY };

export type ApiError = Error & { status?: number };

export async function apiFetch<T>(
  url: string,
  init?: RequestInit & { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(text || res.statusText) as ApiError;
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Get the bearer token from cookies (set by /login).
 * Web-seller uses a localStorage token today; the auth page writes it.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('seller_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('seller_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('seller_token');
}
