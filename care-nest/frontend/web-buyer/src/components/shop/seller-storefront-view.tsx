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
  Sparkles,
  PhoneCall,
  MapPin,
  Building2,
  Award,
  FileText,
  Check,
  ShoppingCart,
  BadgeCheck,
  Quote,
  X,
  Send,
  Clock,
  Users,
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOT' | 'BP' | 'SOS' | 'REVIEWS' | 'ABOUT'>('ALL');

  // Search & Filter in Store
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC'>('POPULAR');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Interactive follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(14820);

  // Vouchers claimed state
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});

  // Share feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick Cart Add feedback
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Chat consultation modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `Xin chào! Tôi là Dược sĩ Lê Thu Trang phụ trách tư vấn kỹ thuật y tế tại ${seller.storeName}. Bạn đang quan tâm đến thiết bị chăm sóc sức khỏe nào cho người thân?`,
      time: 'Vừa xong',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Reviews star filter
  const [reviewFilterStar, setReviewFilterStar] = useState<number | null>(null);

  const handleToggleFollow = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowerCount((count) => (next ? count + 1 : count - 1));
      return next;
    });
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleClaimVoucher = (code: string) => {
    setClaimedVouchers((prev) => ({ ...prev, [code]: true }));
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

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setChatInput('');

    // Simulated Pharmacist Reply
    setTimeout(() => {
      let botReply =
        'Cảm ơn câu hỏi của bạn! Dược sĩ chuyên môn của MedTech đang xem xét chỉ số và sẽ hỗ trợ tư vấn chi tiết cho bạn trong giây lát.';
      if (userMsg.toLowerCase().includes('huyết áp') || userMsg.toLowerCase().includes('omron')) {
        botReply =
          'Dạ máy đo huyết áp Omron HEM-7361T của MedTech có tính năng phát hiện rung nhĩ AFib sớm phòng ngừa đột quỵ. Máy có Bluetooth tự đồng bộ vào app CareNest rất tiện cho gia đình theo dõi!';
      } else if (userMsg.toLowerCase().includes('sos') || userMsg.toLowerCase().includes('khẩn cấp')) {
        botReply =
          'Dạ nút bấm CareNest Home SOS 4G dùng sim IoT đa mạng (Viettel/Vinaphone), chống nước IP67 lắp được cả trong phòng tắm. Bấm 1 chạm là gọi ngay 3 số người thân!';
      } else if (userMsg.toLowerCase().includes('bảo hành') || userMsg.toLowerCase().includes('đổi trả')) {
        botReply =
          'Dạ sản phẩm tại MedTech được bảo hành chính hãng 24 tháng, 1 đổi 1 trong 30 ngày đầu nếu có lỗi nhà sản xuất và có kỹ thuật viên hỗ trợ cài đặt tận nhà ạ.';
      }
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  // Filter products by tab, search and category
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'HOT' && (p.stock ?? 0) < 50) return false;
    if (activeTab === 'BP' && !p.name.toLowerCase().includes('huyết áp')) return false;
    if (activeTab === 'SOS' && !p.name.toLowerCase().includes('sos') && !p.name.toLowerCase().includes('radar')) return false;

    if (selectedCategory !== 'ALL' && p.category?.slug !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice;
    if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice;
    return 0; // Popular / default
  });

  // Filter reviews
  const reviewItems = reviews?.items || [];
  const filteredReviews = reviewFilterStar
    ? reviewItems.filter((r) => r.rating === reviewFilterStar)
    : reviewItems;

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
              <span>CARENEST OFFICIAL MALL</span>
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Trung Tâm Thiết Bị Y Tế &amp; Giám Sát Sức Khỏe Gia Đình
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
                  <MapPin size={13} className="text-teal-600" /> Cầu Giấy, Hà Nội
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} className="text-teal-600" /> Tham gia 3 năm
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} className="text-teal-600" /> Đạt chuẩn ISO 13485
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Follow & Chat) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() =>
                emitOpenChat({
                  sellerId: seller.id,
                  storeName: seller.storeName,
                  storeSlug: seller.storeSlug,
                  initialMessage: `Xin chào ${seller.storeName}, tôi muốn tư vấn về các thiết bị y tế của shop.`,
                })
              }
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
              <span>Chat Với Dược Sĩ</span>
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
            <div style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, fontSize: '14px' }}>
              <Star size={16} fill="#d97706" /> {seller.ratingAvg.toFixed(1)}
            </div>
            <div style={{ color: '#64748b' }}>
              Đánh giá cửa hàng <strong style={{ color: '#0f172a' }}>({seller.ratingCount})</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={16} className="text-teal-600" />
            <div style={{ color: '#64748b' }}>
              Người theo dõi: <strong style={{ color: '#0f172a' }}>{followerCount.toLocaleString('vi-VN')}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={16} className="text-emerald-600" />
            <div style={{ color: '#64748b' }}>
              Tỉ lệ phản hồi: <strong style={{ color: '#047857' }}>99%</strong> (Nhanh chóng)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={16} className="text-indigo-600" />
            <div style={{ color: '#64748b' }}>
              Giao đúng hạn: <strong style={{ color: '#3730a3' }}>99.5%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXCLUSIVE STORE VOUCHERS (Mã Giảm Giá Cửa Hàng) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} className="text-amber-500" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Mã Giảm Giá Độc Quyền Của Cửa Hàng
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Áp dụng trực tiếp khi thanh toán</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {[
            {
              code: 'MEDTECH50K',
              discount: 'GIẢM 50.000 đ',
              condition: 'Cho đơn hàng từ 500.000 đ',
              expiry: 'HSD: 30/11/2026',
              badge: 'Bán chạy',
            },
            {
              code: 'MEDTECH150K',
              discount: 'GIẢM 150.000 đ',
              condition: 'Cho đơn hàng từ 1.800.000 đ',
              expiry: 'HSD: 30/11/2026',
              badge: 'Ưu đãi lớn',
            },
            {
              code: 'FREESHIPMAX',
              discount: 'MIỄN PHÍ VẬN CHUYỂN',
              condition: 'Giảm tối đa 35k đơn từ 300.000 đ',
              expiry: 'HSD: 30/11/2026',
              badge: 'Toàn quốc',
            },
          ].map((v) => {
            const isClaimed = claimedVouchers[v.code];
            return (
              <div
                key={v.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#fef3c7',
                        color: '#92400e',
                      }}
                    >
                      {v.badge}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
                      {v.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                    {v.discount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{v.condition}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{v.expiry}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaimVoucher(v.code)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: isClaimed ? '#ecfdf5' : 'var(--primary, #0d9488)',
                    color: isClaimed ? '#047857' : '#ffffff',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isClaimed ? '✓ Đã Lưu' : 'Lưu Mã'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. NAVIGATION TABS */}
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
        {[
          { key: 'ALL', label: `Tất Cả Sản Phẩm (${products.length})` },
          { key: 'HOT', label: 'Bán Chạy Nhất' },
          { key: 'BP', label: 'Máy Đo Huyết Áp & Tim Mạch' },
          { key: 'SOS', label: 'Cấp Cứu SOS & Radar IoT' },
          { key: 'REVIEWS', label: `Đánh Giá Từ Khách Hàng (${reviews?.ratingCount || seller.ratingCount})` },
          { key: 'ABOUT', label: 'Hồ Sơ Doanh Nghiệp & Giấy Phép' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 800 : 600,
              color: activeTab === tab.key ? 'var(--primary, #0d9488)' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary, #0d9488)' : '3px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. TOAST NOTIFICATION WHEN PRODUCT ADDED TO CART */}
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

      {/* TAB CONTENT: PRODUCTS LIST (ALL / HOT / BP / SOS) */}
      {(activeTab === 'ALL' || activeTab === 'HOT' || activeTab === 'BP' || activeTab === 'SOS') && (
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
                placeholder="Tìm sản phẩm trong cửa hàng MedTech..."
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: '#64748b' }}>Sắp xếp theo:</span>
              <button
                type="button"
                onClick={() => setSortBy('POPULAR')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: sortBy === 'POPULAR' ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                  background: sortBy === 'POPULAR' ? '#f0fdfa' : '#ffffff',
                  color: sortBy === 'POPULAR' ? 'var(--primary)' : '#475569',
                  fontWeight: sortBy === 'POPULAR' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Phổ biến
              </button>
              <button
                type="button"
                onClick={() => setSortBy('PRICE_ASC')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: sortBy === 'PRICE_ASC' ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                  background: sortBy === 'PRICE_ASC' ? '#f0fdfa' : '#ffffff',
                  color: sortBy === 'PRICE_ASC' ? 'var(--primary)' : '#475569',
                  fontWeight: sortBy === 'PRICE_ASC' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Giá tăng dần
              </button>
              <button
                type="button"
                onClick={() => setSortBy('PRICE_DESC')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: sortBy === 'PRICE_DESC' ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                  background: sortBy === 'PRICE_DESC' ? '#f0fdfa' : '#ffffff',
                  color: sortBy === 'PRICE_DESC' ? 'var(--primary)' : '#475569',
                  fontWeight: sortBy === 'PRICE_DESC' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Giá giảm dần
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Không tìm thấy sản phẩm phù hợp
              </div>
              <p style={{ fontSize: '13px' }}>
                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
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
                const discountPercent =
                  p.compareAtPrice && p.compareAtPrice > p.basePrice
                    ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100)
                    : null;

                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: 0,
                      overflow: 'hidden',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Product Image */}
                    <Link
                      href={`/shop/products/${p.slug || p.id}`}
                      style={{ position: 'relative', display: 'block', height: '200px', background: '#f1f5f9' }}
                    >
                      <img
                        src={p.images[0]?.url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80'}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {discountPercent && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: '#e11d48',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          -{discountPercent}%
                        </div>
                      )}
                      {p.isMedical && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            color: '#38bdf8',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <ShieldCheck size={12} /> Chuẩn Y Tế
                        </div>
                      )}
                    </Link>

                    {/* Product Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 700, marginBottom: '4px' }}>
                        {p.category?.name || 'Thiết bị chăm sóc sức khỏe'}
                      </div>

                      <Link
                        href={`/shop/products/${p.slug || p.id}`}
                        style={{ color: '#0f172a', textDecoration: 'none', marginBottom: '8px' }}
                      >
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            lineHeight: 1.4,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '38px',
                          }}
                        >
                          {p.name}
                        </h4>
                      </Link>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#d97706', fontWeight: 700 }}>
                          <Star size={12} fill="#d97706" /> 4.9
                        </span>
                        <span>•</span>
                        <span>Đã bán 350+</span>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary, #0d9488)' }}>
                            {formatVnd(p.basePrice)}
                          </div>
                          {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              {formatVnd(p.compareAtPrice)}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              emitOpenChat({
                                sellerId: seller.id,
                                storeName: seller.storeName,
                                storeSlug: seller.storeSlug,
                                productId: p.id,
                                productName: p.name,
                                productPrice: p.basePrice,
                                productImage: p.images?.[0]?.url,
                                initialMessage: `Shop tư vấn giúp mình thiết bị "${p.name}" với ạ!`,
                              })
                            }
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Chat tư vấn sản phẩm này"
                          >
                            <MessageSquare size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: '#f0fdfa',
                              border: '1px solid #99f6e4',
                              color: '#0d9488',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Thêm vào giỏ hàng"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        </div>
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
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>
                {seller.ratingAvg.toFixed(1)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '8px 0 4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} fill="#d97706" color="#d97706" />
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Dựa trên <strong>{seller.ratingCount}</strong> đánh giá
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
                Tất Cả ({seller.ratingCount})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilterStar(5)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: reviewFilterStar === 5 ? 700 : 500,
                  background: reviewFilterStar === 5 ? '#0f766e' : '#ffffff',
                  color: reviewFilterStar === 5 ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                }}
              >
                5 Sao (116)
              </button>
              <button
                type="button"
                onClick={() => setReviewFilterStar(4)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: reviewFilterStar === 4 ? 700 : 500,
                  background: reviewFilterStar === 4 ? '#0f766e' : '#ffffff',
                  color: reviewFilterStar === 4 ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                }}
              >
                4 Sao (10)
              </button>
            </div>
          </div>

          {/* Review items */}
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
                          ✓ Đã mua hàng chính hãng
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

                {/* Simulated Shop Reply */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderLeft: '3px solid #0d9488',
                    padding: '10px 14px',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: '#0f766e', display: 'block', marginBottom: '2px' }}>
                    Phản hồi từ {seller.storeName}:
                  </strong>
                  Dạ MedTech chân thành cảm ơn quý khách đã tin tưởng lựa chọn thiết bị y tế chính hãng. Chúc quý khách và gia đình luôn dồi dào sức khỏe!
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ABOUT COMPANY & CERTIFICATIONS */}
      {activeTab === 'ABOUT' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '28px 32px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} className="text-teal-600" />
              <span>Hồ Sơ Doanh Nghiệp &amp; Thông Tin Pháp Lý</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Tên pháp nhân:</span>
                <strong style={{ color: '#0f172a' }}>CÔNG TY TNHH THIẾT BỊ Y TẾ MEDTECH VIỆT NAM</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Mã số thuế doanh nghiệp:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>0108923456</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Giấy phép phân phối TTBYT:</span>
                <strong style={{ color: '#047857' }}>Số 0108923456/BYT-TB (Sở Y Tế cấp)</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Showroom &amp; Trung tâm bảo hành:</span>
                <strong style={{ color: '#0f172a' }}>Số 18, Phố Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Hotline tư vấn kỹ thuật y tế:</span>
                <strong style={{ color: '#0f766e' }}>1900-6868 (Nhánh 2) - 24/7</strong>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Tiêu chuẩn quản lý chất lượng:</span>
                <strong style={{ color: '#0f172a' }}>ISO 13485:2016 &amp; CE Medical Europe</strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Cam Kết Vàng Của MedTech Healthcare
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '13px', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>100% Chính Hãng:</strong> Đầy đủ hóa đơn GTGT, giấy chứng nhận CO/CQ từ hãng sản xuất.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <RotateCcw size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Bảo Hành 1 Đổi 1:</strong> Đổi mới trong 30 ngày nếu phát sinh lỗi kỹ thuật.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Truck size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Giao Hỏa Tốc:</strong> Giao hàng siêu tốc 2h nội thành Hà Nội &amp; TP.HCM.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <PhoneCall size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Kỹ Thuật Hỗ Trợ 24/7:</strong> Dược sĩ và kỹ sư hướng dẫn kết nối ứng dụng tận tình.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE CHAT MODAL WITH PHARMACIST */}
      {isChatOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsChatOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '580px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  DS
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>Dược Sĩ Lê Thu Trang</div>
                  <div style={{ fontSize: '11px', color: '#ccfbf1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                    Trực tuyến hỗ trợ kỹ thuật y tế
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.sender === 'user' ? '#0d9488' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <div>{m.text}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: m.sender === 'user' ? '#ccfbf1' : '#94a3b8',
                      textAlign: 'right',
                      marginTop: '4px',
                    }}
                  >
                    {m.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ padding: '8px 16px', background: '#f1f5f9', display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {[
                'Tư vấn máy đo huyết áp cho người già',
                'Nút bấm SOS dùng sim gì?',
                'Chính sách bảo hành 1 đổi 1',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setChatInput(chip);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendChat}
              style={{
                padding: '12px 16px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi tư vấn y tế..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Send size={15} /> Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

