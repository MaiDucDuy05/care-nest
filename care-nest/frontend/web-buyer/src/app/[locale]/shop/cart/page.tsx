'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  Trash2,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { cartService, type CartItem } from '@/services/cart.service';
import { getToken } from '@/lib/api-client';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string } | null>(null);

  // Checkout form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Hồ Chí Minh');
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO' | 'COD' | 'BANK_TRANSFER'>('COD');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    setIsLoggedIn(!!token);

    async function loadCart() {
      try {
        setIsLoading(true);
        const data = await cartService.getCart();
        if (isMounted) {
          setItems(data.items || []);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCart();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateQty = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const updated = await cartService.updateQuantity(productId, newQty);
      setItems(updated.items);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const updated = await cartService.removeItem(productId);
      setItems(updated.items);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = subtotal >= 500000 || items.length === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  // Bắt buộc đăng nhập trước khi tiến hành thanh toán / đặt mua
  const handleStartCheckout = () => {
    const token = getToken();
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          sellerId: i.sellerId || 'system-store',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine: addressLine.trim(),
          city: city.trim(),
        },
        paymentMethod,
      };

      const result = await cartService.checkout(payload);
      setOrderSuccess({ orderId: result?.id || result?.orderId || 'ORD-' + Date.now().toString().slice(-6) });
      setItems([]);
      setShowCheckoutModal(false);
    } catch (err: unknown) {
      try {
        const p = JSON.parse((err as Error).message);
        setCheckoutError(p.message || 'Đặt hàng không thành công');
      } catch {
        setCheckoutError((err as Error).message || 'Lỗi đặt hàng. Vui lòng thử lại.');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '600px' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--success-light, #d1fae5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--success, #059669)',
          }}>
            <CheckCircle2 size={40} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Đặt Hàng Thành Công!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '20px' }}>
            Mã đơn hàng của bạn là <strong>#{orderSuccess.orderId}</strong>. Đơn hàng đã được lưu trên hệ thống và chuyển sang đơn vị vận chuyển.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/shop/products" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/shop/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Tiếp tục mua sắm
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
          Giỏ Hàng Của Bạn ({items.length} sản phẩm)
        </h1>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải giỏ hàng...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--bg-card-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--text-muted)',
          }}>
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Giỏ hàng đang trống</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Hãy khám phá các thiết bị y tế và chăm sóc sức khỏe gia đình để thêm vào giỏ.
          </p>
          <Link href="/shop/products" className="btn btn-primary" style={{ padding: '12px 28px' }}>
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
          {/* Cart items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px 24px' }}>
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: index > 0 ? '16px' : '0',
                    paddingBottom: index < items.length - 1 ? '16px' : '0',
                    borderBottom: index < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>SP</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{item.name}</h3>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatVnd(item.unitPrice)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Quantity controls */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '0 8px', fontWeight: 700, fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      id={`cart-item-remove-${item.productId}`}
                      onClick={() => handleRemove(item.productId)}
                      style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success, #059669)', fontSize: '13px' }}>
              <ShieldCheck size={20} /> Đã bao gồm cam kết chính hãng, kiểm định nguồn gốc và hỗ trợ cài đặt thiết bị y tế.
            </div>
          </div>

          {/* Order summary */}
          <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Tóm Tắt Đơn Hàng</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tạm tính:</span>
                <span style={{ fontWeight: 600 }}>{formatVnd(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phí vận chuyển:</span>
                <span style={{ color: shippingFee === 0 ? 'var(--success)' : undefined, fontWeight: 600 }}>
                  {shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
                fontWeight: 800,
                fontSize: '18px',
              }}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--primary)' }}>{formatVnd(total)}</span>
              </div>
            </div>

            {/* Cảnh báo bắt buộc đăng nhập nếu chưa có tài khoản */}
            {!isLoggedIn && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#92400e',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                  <Lock size={15} color="#b45309" />
                  <span>Yêu cầu đăng nhập để mua hàng</span>
                </div>
                <div style={{ color: '#78350f', fontSize: '12px', lineHeight: 1.5 }}>
                  Quý khách vui lòng đăng nhập tài khoản trước khi đặt hàng để kích hoạt bảo hành điện tử chính hãng và đồng bộ hồ sơ y tế.
                </div>
              </div>
            )}

            <button
              id="cart-checkout-btn"
              onClick={handleStartCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoggedIn ? (
                <>
                  <CreditCard size={18} />
                  <span>Tiến hành đặt hàng</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Đăng nhập để đặt hàng</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Bắt Buộc Đăng Nhập Trước Khi Mua Hàng */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--primary-light, #ccfbf1)',
              color: 'var(--primary, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={30} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Vui Lòng Đăng Nhập Để Mua Hàng
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              Để kích hoạt bảo hành chính hãng 1 đổi 1 trong 24 tháng và liên kết hồ sơ giám sát y tế cho người thân, quý khách cần đăng nhập tài khoản trước khi hoàn tất đặt mua.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/auth/login?redirect=/shop/cart"
                id="cart-modal-login-btn"
                className="btn btn-primary"
                style={{ padding: '12px', justifyContent: 'center', fontSize: '14px' }}
              >
                Đăng Nhập Ngay
              </Link>

              <Link
                href="/auth/register?redirect=/shop/cart"
                id="cart-modal-register-btn"
                className="btn btn-secondary"
                style={{ padding: '12px', justifyContent: 'center', fontSize: '14px' }}
              >
                Chưa có tài khoản? Đăng Ký
              </Link>

              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '6px',
                  textDecoration: 'underline',
                }}
              >
                Để sau, tiếp tục xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Chỉ mở khi đã đăng nhập) */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Thông Tin Giao Hàng & Thanh Toán</h2>

            {checkoutError && (
              <div style={{
                background: 'var(--danger-light, #fee2e2)',
                color: 'var(--danger, #dc2626)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Địa chỉ nhận hàng</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Số 123 Đường Nguyễn Trãi, Phường 2"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Tỉnh / Thành phố</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Phương thức thanh toán</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
                    { key: 'VNPAY', label: 'Cổng thanh toán VNPAY' },
                    { key: 'MOMO', label: 'Ví điện tử MoMo' },
                    { key: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng trực tiếp' },
                  ].map((m) => (
                    <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.key}
                        checked={paymentMethod === m.key}
                        onChange={() => setPaymentMethod(m.key as any)}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Tổng thanh toán:</span>
                <span style={{ color: 'var(--primary)' }}>{formatVnd(total)}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isCheckingOut ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                    </span>
                  ) : (
                    'Xác nhận đặt hàng'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
