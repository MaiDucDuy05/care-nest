'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Star,
  Truck,
  CheckCircle2,
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { reviewsService } from '@/lib/services/reviews.service';
import { ordersService, type Order } from '@/services/orders.service';
import { Link } from '@/i18n/routing';

const RATING_LABELS = [
  '',
  'Rất không hài lòng',
  'Không hài lòng',
  'Bình thường',
  'Hài lòng',
  'Tuyệt vời, sản phẩm rất tốt!',
];

export default function ReviewPage() {
  const t = useTranslations('review');
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [deliveryConfirmedNotice, setDeliveryConfirmedNotice] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Read token from localStorage so we can tell buyers to log in.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem('buyer_token')) {
      router.replace(`/auth/login?redirect=/orders/${orderId}/review`);
      return;
    }

    if (!orderId) return;

    let isMounted = true;
    async function fetchOrder() {
      setIsLoadingOrder(true);
      try {
        const data = await ordersService.getOrder(orderId);
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Error fetching order for review:', err);
      } finally {
        if (isMounted) setIsLoadingOrder(false);
      }
    }

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId, router]);

  // Buyer confirms delivery right on the review page
  const handleConfirmDelivery = async () => {
    if (!orderId) return;
    setIsConfirmingDelivery(true);
    setError(null);

    try {
      const updated = await ordersService.confirmDelivery(orderId);
      if (updated) {
        setOrder(updated);
      } else if (order) {
        setOrder({ ...order, status: 'DELIVERED' });
      }
      setDeliveryConfirmedNotice(
        'Đã xác nhận nhận hàng thành công! Quý khách có thể gửi đánh giá cho đơn hàng ngay bên dưới.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xác nhận nhận hàng';
      setError(msg);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t('ratingRequired') || 'Vui lòng chọn số sao đánh giá (tối thiểu 1 sao)');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await reviewsService.create({ orderId, rating, comment: comment.trim() || undefined });
      setDone(true);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Gửi đánh giá thất bại';
      // Clean up raw JSON error messages if any
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed.message?.includes('Only delivered orders can be reviewed')) {
          setError(
            'Chỉ đơn hàng đã giao thành công mới có thể đánh giá. Vui lòng bấm "Xác Nhận Đã Nhận Hàng" phía trên trước.'
          );
        } else {
          setError(parsed.message || rawMsg);
        }
      } catch {
        if (rawMsg.includes('Only delivered orders can be reviewed')) {
          setError(
            'Chỉ đơn hàng đã giao thành công mới có thể đánh giá. Vui lòng bấm "Xác Nhận Đã Nhận Hàng" phía trên trước.'
          );
        } else {
          setError(rawMsg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container" style={{ maxWidth: 520, padding: '60px 16px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-h2" style={{ marginBottom: 10, fontSize: '22px', fontWeight: 800 }}>
            {t('thanks') || 'Cảm Ơn Đánh Giá Của Bạn!'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
            {t('thanksBody') ||
              'Đánh giá chân thực của quý khách giúp cộng đồng người chăm sóc và gia đình lựa chọn thiết bị y tế phù hợp nhất.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/orders/${orderId}`}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <ArrowLeft size={15} /> Xem chi tiết đơn hàng
            </Link>
            <Link
              href="/orders"
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <Package size={15} /> Danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDelivered = order?.status === 'DELIVERED';
  const effectiveRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="container" style={{ maxWidth: 560, padding: '40px 16px 80px' }}>
      <Link
        href={`/orders/${orderId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '13px',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={15} /> Quay lại đơn hàng #{order?.orderNumber || orderId}
      </Link>

      <div style={{ marginBottom: '20px' }}>
        <h1 className="text-h2" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
          {t('title') || 'Đánh giá đơn hàng'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {t('subtitle') || 'Chia sẻ trải nghiệm của bạn để giúp người mua và gia đình khác.'}
        </p>
      </div>

      {/* Loading state for order */}
      {isLoadingOrder && (
        <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đang kiểm tra trạng thái đơn hàng...</div>
        </div>
      )}

      {/* Banner nếu đơn hàng chưa được đánh dấu là DELIVERED */}
      {!isLoadingOrder && order && !isDelivered && (
        <div
          style={{
            padding: '18px 20px',
            marginBottom: '20px',
            borderRadius: '16px',
            border: '1px solid #fde047',
            background: 'linear-gradient(180deg, #fefce8 0%, #fef9c3 100%)',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fef08a',
                color: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Truck size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#854d0e' }}>
                  Đơn hàng #{order.orderNumber || orderId} chưa đánh dấu đã nhận
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#a16207', marginBottom: '12px', lineHeight: 1.5 }}>
                Trạng thái hiện tại:{' '}
                <strong style={{ color: '#713f12' }}>
                  {ordersService.getStatusMeta(order.status).label}
                </strong>
                . Bạn chỉ có thể đánh giá sau khi đơn hàng đã được giao thành công.
              </p>

              <button
                type="button"
                disabled={isConfirmingDelivery}
                onClick={handleConfirmDelivery}
                className="btn btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
                }}
              >
                {isConfirmingDelivery ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang cập nhật trạng thái...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Xác Nhận Đã Nhận Hàng (Mark as Delivered)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo xác nhận nhận hàng thành công */}
      {deliveryConfirmedNotice && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{deliveryConfirmedNotice}</span>
        </div>
      )}

      {/* Thông tin tóm tắt sản phẩm trong đơn */}
      {order && order.items && order.items.length > 0 && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
            Sản phẩm trong đơn ({order.items.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName || item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ShoppingBag size={20} color="#94a3b8" />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }} className="truncate">
                    {item.productName || item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Số lượng: x{item.quantity} • {new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form đánh giá */}
      <form onSubmit={onSubmit} className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="text-sm" style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>
            {t('rating') || 'Mức độ hài lòng'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(null)}
                aria-label={`${n} stars`}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: 4,
                  transition: 'transform 0.15s ease',
                }}
                className="hover:scale-125"
              >
                <Star
                  size={34}
                  fill={n <= effectiveRating ? '#d97706' : 'transparent'}
                  color="#d97706"
                  strokeWidth={1.5}
                />
              </button>
            ))}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#d97706', marginLeft: '6px' }}>
              {RATING_LABELS[effectiveRating] || ''}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="text-sm" style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>
            {t('comment') || 'Nhận xét của bạn (tùy chọn)'}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t('commentPlaceholder') || 'Sản phẩm có tốt không? Đóng gói thế nào? Tính năng đo sức khỏe hoạt động ra sao?'}
            className="input"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ padding: '13px', width: '100%', fontSize: '14px', fontWeight: 700 }}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" /> Đang gửi đánh giá...
            </span>
          ) : (
            t('submit') || 'Gửi đánh giá'
          )}
        </button>
      </form>
    </div>
  );
}
