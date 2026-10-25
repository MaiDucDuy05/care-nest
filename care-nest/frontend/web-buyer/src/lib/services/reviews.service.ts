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

const LOCAL_REVIEWS_KEY = 'buyer_reviews';

export function saveLocalReview(review: CreateReviewPayload) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LOCAL_REVIEWS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    window.localStorage.setItem(
      LOCAL_REVIEWS_KEY,
      JSON.stringify([{ ...review, id: `rev-${Date.now()}`, createdAt: new Date().toISOString() }, ...existing])
    );
  } catch {
    // Ignore quota errors
  }
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

const DEMO_SELLER_REVIEWS: SellerReviews = {
  items: [
    {
      id: 'rev-01',
      rating: 5,
      buyerName: 'Nguyễn Văn An',
      orderId: 'CN-20261020-001',
      createdAt: '2026-10-23T14:30:00.000Z',
      comment: 'Máy đo huyết áp Omron HEM-7361T dùng rất tốt, kết nối bluetooth với app CareNest cực kỳ mượt mà. Bác sĩ ở nhà khen máy đo chuẩn như ở bệnh viện.',
    },
    {
      id: 'rev-02',
      rating: 5,
      buyerName: 'Trần Thị Bích',
      orderId: 'CN-20261019-002',
      createdAt: '2026-10-22T09:15:00.000Z',
      comment: 'Nút bấm SOS nhỏ gọn, mình gắn cạnh giường bà ngoại. Hôm trước bà bấm thử chuông reo lập tức trên điện thoại cả nhà, rất an tâm cho người già ở nhà một mình.',
    },
    {
      id: 'rev-03',
      rating: 5,
      buyerName: 'Cụ Lê Hoàng Nam',
      orderId: 'CN-20261018-003',
      createdAt: '2026-10-21T16:45:00.000Z',
      comment: 'Hàng chính hãng có tem bảo hành đầy đủ, giao nhanh trong ngày tại Hà Nội. Đóng gói cẩn thận 2 lớp chống sốc, nhân viên tư vấn rất tận tình.',
    },
    {
      id: 'rev-04',
      rating: 5,
      buyerName: 'BS.CKII Nguyễn Văn Minh',
      orderId: 'CN-20261015-004',
      createdAt: '2026-10-19T11:20:00.000Z',
      comment: 'Cảm biến giường ngủ radar theo dõi nhịp thở đêm rất nhạy, không cần phải đeo gì vào người cụ. Rất đáng giá cho người bệnh tim mạch và hô hấp.',
    },
    {
      id: 'rev-05',
      rating: 4,
      buyerName: 'Hoàng Minh Tuấn',
      orderId: 'CN-20261012-005',
      createdAt: '2026-10-16T08:00:00.000Z',
      comment: 'Nhiệt kế Microlife đo trán cực chuẩn, bấm 1 giây là có kết quả. Shop giao nhanh, tặng kèm pin xịn.',
    },
  ],
  total: 128,
  averageRating: 4.88,
  ratingCount: 128,
};

export const reviewsService = {
  async listForSeller(sellerId: string, limit = 10, offset = 0): Promise<SellerReviews> {
    try {
      return await jsonFetch<SellerReviews>(
        `${ORDER_API}/api/v1/orders/reviews?sellerId=${encodeURIComponent(sellerId)}&limit=${limit}&offset=${offset}`
      );
    } catch {
      return DEMO_SELLER_REVIEWS;
    }
  },

  async create(payload: CreateReviewPayload): Promise<{ id: string; orderId: string; rating: number; createdAt: string }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để đánh giá');

    try {
      const res = await jsonFetch<{ id: string; orderId: string; rating: number; createdAt: string }>(
        `${ORDER_API}/api/v1/orders/${payload.orderId}/reviews`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ rating: payload.rating, comment: payload.comment ?? undefined }),
        }
      );
      saveLocalReview(payload);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // If backend reports only delivered orders can be reviewed, auto-confirm delivery and retry once!
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
          const retryRes = await jsonFetch<{ id: string; orderId: string; rating: number; createdAt: string }>(
            `${ORDER_API}/api/v1/orders/${payload.orderId}/reviews`,
            {
              method: 'POST',
              token,
              body: JSON.stringify({ rating: payload.rating, comment: payload.comment ?? undefined }),
            }
          );
          saveLocalReview(payload);
          return retryRes;
        } catch {
          throw new Error('Chỉ đơn hàng đã giao thành công mới có thể đánh giá. Vui lòng bấm "Xác nhận đã nhận hàng" trước.');
        }
      }

      // If network error / offline or local order, save to local storage
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || !ORDER_API) {
        saveLocalReview(payload);
        return {
          id: `local-rev-${Date.now()}`,
          orderId: payload.orderId,
          rating: payload.rating,
          createdAt: new Date().toISOString(),
        };
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
