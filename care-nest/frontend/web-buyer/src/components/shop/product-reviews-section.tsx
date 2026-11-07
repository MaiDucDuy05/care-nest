'use client';

import { useState } from 'react';
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Filter,
  Inbox,
} from 'lucide-react';
import type { PublicProduct } from '@/lib/services/public-catalog.service';
import type { SellerReviews, ReviewListItem } from '@/lib/services/reviews.service';

interface ProductReviewsSectionProps {
  product: PublicProduct;
  reviews?: SellerReviews | null;
  locale: 'vi' | 'en';
}

export function ProductReviewsSection({
  product,
  reviews,
  locale,
}: ProductReviewsSectionProps) {
  const isVi = locale === 'vi';

  const items: ReviewListItem[] = reviews?.items || [];
  const total = reviews?.total ?? items.length;
  const averageRating = reviews?.averageRating ?? 0;

  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Real star breakdown derived from real items
  const starBreakdown = [5, 4, 3, 2, 1].map((s) => {
    const count = items.filter((r) => r.rating === s).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { star: s, count, percentage };
  });

  const filteredReviews = filterStar !== null
    ? items.filter((r) => r.rating === filterStar)
    : items;

  const handleToggleLike = (id: string) => {
    setLikedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="reviews-section" style={{ marginTop: '48px', scrollMarginTop: '80px' }}>
      {/* Title Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {isVi ? 'Đánh Giá & Nhận Xét Từ Khách Hàng' : 'Customer Reviews & Feedback'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            {total > 0
              ? isVi
                ? `Tổng cộng ${total} đánh giá từ người mua thực tế`
                : `${total} reviews from verified buyers`
              : isVi
              ? 'Sản phẩm này hiện chưa có đánh giá nào từ người mua'
              : 'This product currently has no customer reviews'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#ecfdf5',
              color: '#047857',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid #a7f3d0',
            }}
          >
            <ShieldCheck size={16} /> {isVi ? '100% Đánh giá thực tế' : '100% Real Reviews'}
          </span>
        </div>
      </div>

      {/* Overview Rating Card */}
      <div
        className="card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          {/* Big Score Box */}
          <div
            style={{
              textAlign: 'center',
              paddingRight: '20px',
              borderRight: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '52px', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '4px',
                margin: '10px 0 6px',
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={22}
                  fill={i <= Math.round(averageRating) && averageRating > 0 ? '#d97706' : 'transparent'}
                  color="#d97706"
                />
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              {isVi ? `Dựa trên ${total} đánh giá` : `Based on ${total} reviews`}
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {starBreakdown.map(({ star, count, percentage }) => (
              <div
                key={star}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  cursor: count > 0 ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (count > 0) setFilterStar(filterStar === star ? null : star);
                }}
                title={`Đánh giá ${star} sao (${count})`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '54px' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{star}</span>
                  <Star size={13} fill="#d97706" color="#d97706" />
                </div>

                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: '#e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: star >= 4 ? '#d97706' : '#94a3b8',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ width: '48px', textAlign: 'right', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                  {count}
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee & Benefits Box */}
          <div
            style={{
              paddingLeft: '16px',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
              {isVi ? 'Quyền lợi người mua tại CareNest Mall:' : 'CareNest Mall Buyer Protection:'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <CheckCircle2 size={16} className="text-teal-600 flex-shrink-0" />
              <span>{isVi ? '100% Sản phẩm chính hãng y tế / IoT' : '100% Authentic medical & IoT devices'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <CheckCircle2 size={16} className="text-teal-600 flex-shrink-0" />
              <span>{isVi ? 'Đổi trả miễn phí 7 ngày nếu lỗi NSX' : '7-day free return for manufacturing defects'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <CheckCircle2 size={16} className="text-teal-600 flex-shrink-0" />
              <span>{isVi ? 'Chỉ người đã nhận hàng mới được viết đánh giá' : 'Only verified buyers can review'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      {total > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> {isVi ? 'Lọc theo:' : 'Filter:'}
          </span>

          <button
            type="button"
            onClick={() => setFilterStar(null)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: filterStar === null ? 700 : 500,
              background: filterStar === null ? '#0d9488' : '#ffffff',
              color: filterStar === null ? '#ffffff' : '#475569',
              border: filterStar === null ? '1px solid #0d9488' : '1px solid #cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isVi ? `Tất Cả (${total})` : `All (${total})`}
          </button>

          {starBreakdown.map(({ star, count }) => (
            <button
              key={star}
              type="button"
              onClick={() => setFilterStar(filterStar === star ? null : star)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: filterStar === star ? 700 : 500,
                background: filterStar === star ? '#0d9488' : '#ffffff',
                color: filterStar === star ? '#ffffff' : '#475569',
                border: filterStar === star ? '1px solid #0d9488' : '1px solid #cbd5e1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{star} Sao</span>
              <span style={{ opacity: 0.85 }}>({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Review Cards List or Empty State */}
      {filteredReviews.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            background: '#fafafa',
          }}
        >
          <Inbox size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            {filterStar
              ? isVi
                ? `Chưa có đánh giá ${filterStar} sao nào`
                : `No ${filterStar}-star reviews yet`
              : isVi
              ? 'Chưa có đánh giá nào cho sản phẩm này'
              : 'No reviews yet for this product'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {isVi
              ? 'Sản phẩm này hiện chưa nhận được nhận xét nào từ người mua. Đánh giá sẽ xuất hiện khi có đơn hàng hoàn thành.'
              : 'This product has not received any buyer feedback yet. Reviews will appear here once orders are delivered.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReviews.map((r) => {
            const isLiked = !!likedReviews[r.id];

            return (
              <div
                key={r.id}
                className="card"
                style={{
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Review Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* User Avatar Initials */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {r.buyerName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        {r.buyerName}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {/* Rating Stars */}
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < r.rating ? '#d97706' : 'transparent'}
                              color="#d97706"
                            />
                          ))}
                        </div>

                        {/* Verified Purchase Badge */}
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#059669',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#ecfdf5',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}
                        >
                          <CheckCircle2 size={12} /> {isVi ? 'Đã mua hàng' : 'Verified Buyer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                  </span>
                </div>

                {/* Review Body */}
                {r.comment && (
                  <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.65 }}>
                    {r.comment}
                  </div>
                )}

                {/* Footer Reactions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleLike(r.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isLiked ? '#f0fdf4' : 'transparent',
                      border: isLiked ? '1px solid #86efac' : '1px solid #e2e8f0',
                      color: isLiked ? '#15803d' : '#64748b',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ThumbsUp size={13} fill={isLiked ? '#15803d' : 'transparent'} />
                    <span>{isVi ? 'Hữu ích' : 'Helpful'}</span>
                  </button>

                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageCircle size={13} /> {isVi ? 'Bình luận' : 'Comment'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
