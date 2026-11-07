'use client';

import { useState } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Truck,
  RotateCcw,
  MessageSquare,
  Share2,
  Heart,
  Search,
  PhoneCall,
  Building2,
  Award,
  Check,
  ShoppingCart,
  BadgeCheck,
  Quote,
  Clock,
  ChevronLeft,
  ShoppingBag,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { PublicSeller, PublicProduct } from '@/lib/services/public-catalog.service';
import type { SellerReviews } from '@/lib/services/reviews.service';
import { cartService, emitCartUpdated } from '@/services/cart.service';
import { emitOpenChat } from '@/lib/services/chat.service';

interface SellerStorefrontViewProps {
  seller: PublicSeller;
  products: PublicProduct[];
  reviews: SellerReviews | null;
  locale: string;
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export function SellerStorefrontView({
  seller,
  products,
  reviews,
  locale,
}: SellerStorefrontViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Search & Sort in Store
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC'>('POPULAR');

  // Interactive follow
  const [isFollowing, setIsFollowing] = useState(false);

  // Share feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick Cart Add feedback
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Reviews star filter
  const [reviewFilterStar, setReviewFilterStar] = useState<number | null>(null);

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenStoreChat = () => {
    emitOpenChat({
      sellerId: seller.id,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      initialMessage: `Xin chào ${seller.storeName}, tôi muốn tìm hiểu thông tin về sản phẩm của cửa hàng.`,
    });
  };

  const handleAddToCart = async (p: PublicProduct) => {
    try {
      await cartService.addItem({
        productId: p.id,
        sellerId: seller.id,
        name: p.name,
        unitPrice: p.basePrice,
        quantity: 1,
        imageUrl: p.images[0]?.url,
      });
      const updated = await cartService.getCart();
      emitCartUpdated(updated);
      setAddedItemName(p.name);
      setTimeout(() => setAddedItemName(null), 3000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // Derive unique categories dynamically from products
  const storeCategories = Array.from(
    new Map(
      products
        .filter((p) => p.category?.id && p.category?.name)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  );

  // Filter products by tab, search and sort
  const filteredProducts = products
    .filter((p) => {
      if (activeTab !== 'ALL' && activeTab !== 'REVIEWS' && activeTab !== 'ABOUT') {
        const catId = activeTab.replace('CAT_', '');
        if (p.category?.id !== catId && p.category?.slug !== catId) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice;
      if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice;
      return 0;
    });

  // Filter reviews
  const reviewItems = reviews?.items || [];
  const filteredReviews = reviewFilterStar
    ? reviewItems.filter((r) => r.rating === reviewFilterStar)
    : reviewItems;

  const totalReviewsCount = reviews?.total ?? seller.ratingCount ?? reviewItems.length;
  const effectiveRating =
    reviews && reviews.total > 0 && reviews.averageRating > 0
      ? reviews.averageRating
      : totalReviewsCount > 0 && Number(seller.ratingAvg) > 0
      ? Number(seller.ratingAvg)
      : 0;

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviewItems.filter((r) => r.rating === s).length,
  }));

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '80px', maxWidth: '1200px' }}>
      {/* 1. Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Link
          href="/shop/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} /> {locale === 'vi' ? 'Quay lại danh mục sản phẩm' : 'All products'}
        </Link>

        {copiedLink && (
          <span
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              fontWeight: 600,
            }}
          >
            ✓ Đã sao chép liên kết gian hàng vào bộ nhớ tạm
          </span>
        )}
      </div>

      {/* 2. HERO STORE HEADER CARD */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Cover Banner */}
        <div
          style={{
            height: '140px',
            background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 40%, #0e7490 80%, #1e1b4b 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            color: '#ffffff',
          }}
        >
          <div style={{ zIndex: 2, maxWidth: '600px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              <Award size={13} className="text-amber-300" />
              <span>CARENEST OFFICIAL STORE</span>
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {seller.storeName}
            </h2>
          </div>

          <div
            style={{
              position: 'absolute',
              right: '24px',
              bottom: '16px',
              display: 'flex',
              gap: '12px',
              zIndex: 2,
            }}
          >
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Share2 size={14} /> Chia sẻ
            </button>
          </div>
        </div>

        {/* Store Profile Info Row */}
        <div
          style={{
            padding: '24px 32px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '320px', flex: 1 }}>
            {/* Store Avatar */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 900,
                boxShadow: '0 8px 16px -4px rgba(13, 148, 136, 0.4)',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {seller.storeName.charAt(0).toUpperCase()}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#047857',
                  border: '2px solid #ffffff',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {seller.storeName}
                </h1>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <BadgeCheck size={14} /> Chính Hãng
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} className="text-teal-600" /> Tham gia: {new Date(seller.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} className="text-teal-600" /> Đã xác thực KYC CareNest
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShoppingBag size={13} className="text-teal-600" /> {products.length} sản phẩm
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Follow & Chat) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleOpenStoreChat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0f766e',
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare size={16} />
              <span>Nhắn tin với Shop</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFollow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                background: isFollowing ? '#047857' : 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <Heart size={16} fill={isFollowing ? '#ffffff' : 'transparent'} />
              <span>{isFollowing ? '✓ Đang Theo Dõi' : '+ Theo Dõi'}</span>
            </button>
          </div>
        </div>

        {/* Store Trust Badges & Metrics Bar */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            padding: '14px 32px',
            background: '#f8fafc',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {totalReviewsCount > 0 && effectiveRating > 0 ? (
              <div style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, fontSize: '14px' }}>
                <Star size={16} fill="#d97706" color="#d97706" /> {effectiveRating.toFixed(1)}
              </div>
            ) : (
              <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '13px' }}>
                <Star size={16} fill="transparent" color="#cbd5e1" /> Chưa có đánh giá
              </div>
            )}
            <div style={{ color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>({totalReviewsCount})</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={16} className="text-teal-600" />
            <div style={{ color: '#64748b' }}>
              Sản phẩm: <strong style={{ color: '#0f172a' }}>{products.length}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BadgeCheck size={16} className="text-emerald-600" />
            <div style={{ color: '#64748b' }}>
              Chứng nhận: <strong style={{ color: '#047857' }}>KYC Verified Seller</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={16} className="text-indigo-600" />
            <div style={{ color: '#64748b' }}>
              Giao hàng: <strong style={{ color: '#3730a3' }}>Toàn quốc</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'ALL' ? 800 : 600,
            color: activeTab === 'ALL' ? 'var(--primary, #0d9488)' : '#64748b',
            borderBottom: activeTab === 'ALL' ? '3px solid var(--primary, #0d9488)' : '3px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Tất Cả Sản Phẩm ({products.length})
        </button>

        {storeCategories.map((cat) => {
          const tabKey = `CAT_${cat.id}`;
          const count = products.filter((p) => p.category?.id === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: activeTab === tabKey ? 800 : 600,
                color: activeTab === tabKey ? 'var(--primary, #0d9488)' : '#64748b',
                borderBottom: activeTab === tabKey ? '3px solid var(--primary, #0d9488)' : '3px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.name} ({count})
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveTab('REVIEWS')}
          style={{
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'REVIEWS' ? 800 : 600,
            color: activeTab === 'REVIEWS' ? 'var(--primary, #0d9488)' : '#64748b',
            borderBottom: activeTab === 'REVIEWS' ? '3px solid var(--primary, #0d9488)' : '3px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Đánh Giá ({totalReviewsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ABOUT')}
          style={{
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'ABOUT' ? 800 : 600,
            color: activeTab === 'ABOUT' ? 'var(--primary, #0d9488)' : '#64748b',
            borderBottom: activeTab === 'ABOUT' ? '3px solid var(--primary, #0d9488)' : '3px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Hồ Sơ Gian Hàng
        </button>
      </div>

      {/* 4. TOAST NOTIFICATION WHEN PRODUCT ADDED TO CART */}
      {addedItemName && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: '12px',
            background: '#047857',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Đã thêm <strong>{addedItemName}</strong> vào giỏ hàng!</span>
        </div>
      )}

      {/* TAB CONTENT: PRODUCTS LIST (ALL or CATEGORIES) */}
      {activeTab !== 'REVIEWS' && activeTab !== 'ABOUT' && (
        <div>
          {/* Search & Sort Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Search within Store */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                minWidth: '280px',
                maxWidth: '400px',
                flex: 1,
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm sản phẩm trong ${seller.storeName}...`}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="POPULAR">Phổ biến nhất</option>
                <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
                <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                color: '#64748b',
                border: '1px dashed #cbd5e1',
              }}
            >
              <ShoppingBag size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p style={{ fontSize: '13px' }}>
                {searchQuery
                  ? `Không có kết quả nào khớp với "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
                  : 'Gian hàng hiện chưa có sản phẩm nào trong danh mục này.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredProducts.map((p) => {
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
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {hasDiscount && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          zIndex: 2,
                          background: '#dc2626',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        -{discountPercent}%
                      </span>
                    )}

                    <Link href={path} style={{ display: 'block', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                      {image ? (
                        <img
                          src={image}
                          alt={p.images[0]?.alt ?? p.name}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            transition: 'transform 0.3s ease',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            height: '180px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                          }}
                        >
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </Link>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {p.isMedical && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3' }}>
                          Y Khoa
                        </span>
                      )}
                      {p.isIotDevice && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#ccfbf1', color: '#0f766e' }}>
                          IoT Care
                        </span>
                      )}
                    </div>

                    <Link href={path} style={{ textDecoration: 'none', color: '#0f172a', marginTop: '6px', flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.name}
                      </h3>
                    </Link>

                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#0d9488' }}>
                          {formatVnd(p.basePrice)}
                        </span>
                        {hasDiscount && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {formatVnd(p.compareAtPrice!)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            background: '#0d9488',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <ShoppingCart size={14} /> Thêm Giỏ
                        </button>
                        <Link
                          href={path}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#f1f5f9',
                            color: '#0f172a',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          Chi Tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CUSTOMER REVIEWS */}
      {activeTab === 'REVIEWS' && (
        <div>
          {/* Review Score Summary Box */}
          <div
            className="card"
            style={{
              padding: '24px 28px',
              marginBottom: '24px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{ fontSize: '42px', fontWeight: 900, color: totalReviewsCount > 0 && effectiveRating > 0 ? '#d97706' : '#94a3b8', lineHeight: 1 }}>
                {totalReviewsCount > 0 && effectiveRating > 0 ? effectiveRating.toFixed(1) : '—'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '8px 0 4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={totalReviewsCount > 0 && effectiveRating > 0 && i <= Math.round(effectiveRating) ? '#d97706' : 'transparent'}
                    color={totalReviewsCount > 0 && effectiveRating > 0 ? '#d97706' : '#cbd5e1'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Dựa trên <strong>{totalReviewsCount}</strong> đánh giá
              </div>
            </div>

            {/* Star Distribution Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
              <button
                type="button"
                onClick={() => setReviewFilterStar(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: reviewFilterStar === null ? 700 : 500,
                  background: reviewFilterStar === null ? '#0f766e' : '#ffffff',
                  color: reviewFilterStar === null ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                }}
              >
                Tất Cả ({reviewItems.length})
              </button>
              {starCounts.map(({ star, count }) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewFilterStar(star)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: reviewFilterStar === star ? 700 : 500,
                    background: reviewFilterStar === star ? '#0f766e' : '#ffffff',
                    color: reviewFilterStar === star ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  {star} Sao ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Review items */}
          {filteredReviews.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
                border: '1px solid #e2e8f0',
              }}
            >
              <Quote size={36} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Chưa có đánh giá nào
              </h3>
              <p style={{ fontSize: '13px' }}>
                {reviewFilterStar
                  ? `Chưa có đánh giá ${reviewFilterStar} sao nào.`
                  : 'Gian hàng này hiện chưa nhận được đánh giá nào từ người mua.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredReviews.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: '20px 24px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '16px',
                        }}
                      >
                        {r.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          {r.buyerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i < r.rating ? '#d97706' : 'transparent'}
                                color="#d97706"
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                            ✓ Đã mua hàng
                          </span>
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {r.comment && (
                    <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, paddingLeft: '4px' }}>
                      <Quote size={14} style={{ display: 'inline', color: '#0d9488', marginRight: '6px' }} />
                      {r.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ABOUT STORE & CERTIFICATIONS */}
      {activeTab === 'ABOUT' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '28px 32px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} className="text-teal-600" />
              <span>Hồ Sơ Gian Hàng &amp; Xác Thực</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Tên gian hàng:</span>
                <strong style={{ color: '#0f172a' }}>{seller.storeName}</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Đường dẫn gian hàng:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{seller.storeSlug}</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Thời gian tham gia:</span>
                <strong style={{ color: '#047857' }}>{new Date(seller.createdAt).toLocaleDateString('vi-VN')}</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Trạng thái xác thực KYC:</span>
                <strong style={{ color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <BadgeCheck size={16} /> Đã xác thực danh tính &amp; giấy phép
                </strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Tổng số sản phẩm:</span>
                <strong style={{ color: '#0f172a' }}>{products.length} sản phẩm đang kinh doanh</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Đánh giá trung bình:</span>
                <strong style={{ color: totalReviewsCount > 0 && effectiveRating > 0 ? '#d97706' : '#64748b' }}>
                  {totalReviewsCount > 0 && effectiveRating > 0 ? `${effectiveRating.toFixed(1)} / 5.0 ⭐ (${totalReviewsCount} đánh giá)` : 'Chưa có đánh giá'}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Cam Kết Dịch Vụ CareNest Mall
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '13px', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>100% Chính Hãng:</strong> Sản phẩm có nguồn gốc xuất xứ rõ ràng và được kiểm định chất lượng.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <RotateCcw size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Chính Sách Đổi Trả:</strong> Hỗ trợ đổi trả theo chính sách bảo vệ người mua của CareNest.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Truck size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Giao Hàng An Toàn:</strong> Đóng gói cẩn thận, theo dõi vận đơn thời gian thực.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <PhoneCall size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Hỗ Trợ Khách Hàng:</strong> Hỗ trợ kỹ thuật và giải đáp thắc mắc liên tục qua CareNest Chat.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
