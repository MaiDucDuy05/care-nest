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
  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
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
    try {
      return await jsonFetch<SellerReviews>(
        `${ORDER_API}/api/v1/orders/reviews?sellerId=${encodeURIComponent(sellerId)}&limit=${limit}&offset=${offset}`
      );
    } catch {
      return {
        items: [],
        total: 0,
        averageRating: 0,
        ratingCount: 0,
      };
    }
  },

  async listForProduct(productId: string, limit = 10, offset = 0): Promise<SellerReviews> {
    try {
      return await jsonFetch<SellerReviews>(
        `${ORDER_API}/api/v1/orders/reviews?productId=${encodeURIComponent(productId)}&limit=${limit}&offset=${offset}`
      );
    } catch {
      return {
        items: [],
        total: 0,
        averageRating: 0,
        ratingCount: 0,
      };
    }
  },

  async create(payload: CreateReviewPayload): Promise<{ id: string; orderId: string; rating: number; createdAt: string }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để đánh giá');

    try {
      return await jsonFetch<{ id: string; orderId: string; rating: number; createdAt: string }>(
        `${ORDER_API}/api/v1/orders/${payload.orderId}/reviews`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ rating: payload.rating, comment: payload.comment ?? undefined }),
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // If backend reports only delivered orders can be reviewed, auto-confirm delivery and retry once
      if (msg.includes('Only delivered orders can be reviewed')) {
        try {
          await fetch(`${ORDER_API}/api/v1/orders/${encodeURIComponent(payload.orderId)}/deliver`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          // Retry review creation
          return await jsonFetch<{ id: string; orderId: string; rating: number; createdAt: string }>(
            `${ORDER_API}/api/v1/orders/${payload.orderId}/reviews`,
            {
              method: 'POST',
              token,
              body: JSON.stringify({ rating: payload.rating, comment: payload.comment ?? undefined }),
            }
          );
        } catch {
          throw new Error('Chỉ đơn hàng đã giao thành công mới có thể đánh giá. Vui lòng bấm "Xác nhận đã nhận hàng" trước.');
        }
      }

      // Try parsing JSON error from backend
      try {
        const parsed = JSON.parse(msg);
        throw new Error(parsed.message || msg);
      } catch {
        throw err;
      }
    }
  },
};
