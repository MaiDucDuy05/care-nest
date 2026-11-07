'use client';

import { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Star,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  MessageCircle,
  Inbox,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { PublicProduct } from '@/lib/services/public-catalog.service';

interface ProductRecommendationsProps {
  currentProduct: PublicProduct;
  initialRelatedProducts?: PublicProduct[];
  locale: 'vi' | 'en';
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export function ProductRecommendations({
  currentProduct,
  initialRelatedProducts = [],
  locale,
}: ProductRecommendationsProps) {
  const isVi = locale === 'vi';
  const [activeTab, setActiveTab] = useState<'ALL' | 'CATEGORY' | 'SELLER'>('ALL');

  // Filter based on tab without creating any mock data
  const categoryProducts = initialRelatedProducts.filter(
    (p) => currentProduct.category?.id && p.category?.id === currentProduct.category.id
  );

  const sellerProducts = initialRelatedProducts.filter(
    (p) => currentProduct.seller?.id && p.seller?.id === currentProduct.seller.id
  );

  let displayProducts = initialRelatedProducts;
  if (activeTab === 'CATEGORY') {
    displayProducts = categoryProducts.length > 0 ? categoryProducts : initialRelatedProducts;
  } else if (activeTab === 'SELLER') {
    displayProducts = sellerProducts.length > 0 ? sellerProducts : initialRelatedProducts;
  }

  return (
    <section style={{ marginTop: '56px', scrollMarginTop: '80px' }}>
      {/* Header with Title and Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isVi ? 'Gợi Ý Cho Bạn — Sản Phẩm Tương Tự' : 'Recommended For You'}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {isVi
              ? 'Khám phá các sản phẩm liên quan trong hệ thống CareNest Mall'
              : 'Discover related products available on CareNest Mall'}
          </p>
        </div>

        {/* Tab Selection */}
        {initialRelatedProducts.length > 0 && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '12px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                background: activeTab === 'ALL' ? '#ffffff' : 'transparent',
                color: activeTab === 'ALL' ? '#0d9488' : '#64748b',
                boxShadow: activeTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isVi ? `Tất Cả (${initialRelatedProducts.length})` : `All (${initialRelatedProducts.length})`}
            </button>

            {currentProduct.category && categoryProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('CATEGORY')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'CATEGORY' ? 700 : 500,
                  background: activeTab === 'CATEGORY' ? '#ffffff' : 'transparent',
                  color: activeTab === 'CATEGORY' ? '#0d9488' : '#64748b',
                  boxShadow: activeTab === 'CATEGORY' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isVi ? `Cùng Danh Mục (${categoryProducts.length})` : 'Category'}
              </button>
            )}

            {currentProduct.seller && sellerProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('SELLER')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === 'SELLER' ? 700 : 500,
                  background: activeTab === 'SELLER' ? '#ffffff' : 'transparent',
                  color: activeTab === 'SELLER' ? '#0d9488' : '#64748b',
                  boxShadow: activeTab === 'SELLER' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isVi ? `Cùng Shop (${sellerProducts.length})` : 'From Shop'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Real Recommended Products or Empty State */}
      {displayProducts.length === 0 ? (
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
            {isVi ? 'Chưa có sản phẩm gợi ý tương tự' : 'No related products available'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {isVi
              ? 'Hiện tại chưa có sản phẩm nào khác trong cùng phân khúc hoặc danh mục này.'
              : 'There are currently no other products in this category.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          {displayProducts.map((p) => {
            const path = `/shop/products/${p.slug || p.id}`;
            const image = p.images[0]?.url;
            const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.basePrice;
            const discountPercent = hasDiscount
              ? Math.round(((p.compareAtPrice! - p.basePrice) / p.compareAtPrice!) * 100)
              : 0;

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Discount Tag */}
                {hasDiscount && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 2,
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Zap size={10} fill="#ffffff" />
                    <span>-{discountPercent}%</span>
                  </div>
                )}

                {/* Product Image */}
                <Link
                  href={path}
                  style={{
                    display: 'block',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    aspectRatio: '1 / 1',
                    background: '#f8fafc',
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={p.images[0]?.alt ?? p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShoppingBag size={32} color="#94a3b8" />
                    </div>
                  )}
                </Link>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {p.isMedical && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#e0e7ff',
                        color: '#4338ca',
                      }}
                    >
                      {isVi ? 'Y Khoa' : 'Medical'}
                    </span>
                  )}
                  {p.isIotDevice && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#ccfbf1',
                        color: '#0f766e',
                      }}
                    >
                      IoT Telemetry
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <Link
                  href={path}
                  style={{
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    lineHeight: 1.4,
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '38px',
                  }}
                  title={p.name}
                >
                  {p.name}
                </Link>

                {/* Seller & Category */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#64748b',
                    marginBottom: '12px',
                  }}
                >
                  {p.seller && (
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.seller.storeName}
                    </span>
                  )}
                  {p.category && (
                    <span style={{ color: '#94a3b8' }}>
                      {p.category.name}
                    </span>
                  )}
                </div>

                {/* Price and Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0d9488' }}>
                      {formatVnd(p.basePrice)}
                    </div>
                    {hasDiscount && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        {formatVnd(p.compareAtPrice!)}
                      </div>
                    )}
                  </div>

                  <Link
                    href={path}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{isVi ? 'Xem' : 'View'}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cross-Sell Consultation Banner */}
      {currentProduct.seller && (
        <div
          className="card"
          style={{
            marginTop: '32px',
            padding: '20px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
            border: '1px solid #99f6e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                {isVi
                  ? `Xem thêm sản phẩm từ ${currentProduct.seller.storeName}`
                  : `Browse more products from ${currentProduct.seller.storeName}`}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                {isVi
                  ? 'Gian hàng chính hãng KYC Verified Seller trên CareNest Mall'
                  : 'KYC Verified official seller on CareNest Mall'}
              </div>
            </div>
          </div>

          <Link
            href={`/shop/sellers/${currentProduct.seller.storeSlug}`}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#0d9488',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
            }}
          >
            <MessageCircle size={16} />
            <span>{isVi ? 'Xem Gian Hàng' : 'Visit Store'}</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
