import { ORDER_API, getToken } from '../api-client';

export interface ReviewListItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyerName: string;
  orderId: string;
}

export interface SellerReviews {
  items: ReviewListItem[];
  total: number;
  averageRating: number;
  ratingCount: number;
}

export interface CreateReviewPayload {
  orderId: string;
  rating: number;
  comment?: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(text || res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const reviewsService = {
  async listForSeller(sellerId: string, limit = 10, offset = 0): Promise<SellerReviews> {
    return jsonFetch<SellerReviews>(
      `${ORDER_API}/api/v1/orders/reviews?sellerId=${encodeURIComponent(sellerId)}&limit=${limit}&offset=${offset}`
    );
  },

  async create(payload: CreateReviewPayload): Promise<{ id: string; orderId: string; rating: number; createdAt: string }> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return jsonFetch<{ id: string; orderId: string; rating: number; createdAt: string }>(
      `${ORDER_API}/api/v1/orders/${payload.orderId}/reviews`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ rating: payload.rating, comment: payload.comment ?? undefined }),
      }
    );
  },
};
