'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
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
  LogIn,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { cartService, type CartItem } from '@/services/cart.service';
import { ordersService, saveLocalOrder, updateLocalOrderStatus } from '@/services/orders.service';
import { PaymentSimulatorModal, PaymentGatewayType } from '@/components/payment/payment-simulator-modal';
import { authService } from '@/services/auth.service';
import { getToken } from '@/lib/api-client';
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string } | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
    method: PaymentGatewayType;
  } | null>(null);

  // Checkout form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [city, setCity] = useState('Hồ Chí Minh');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO' | 'COD' | 'BANK_TRANSFER'>('COD');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    const hasToken = !!token;
    setIsLoggedIn(hasToken);

    // Tự động điền họ tên, SĐT & địa chỉ của người mua nếu đã đăng nhập
    if (hasToken && token) {
      authService.me(token).then((profile) => {
        if (isMounted && profile) {
          if (profile.fullName) setFullName(profile.fullName);
          if (profile.phone) setPhone(profile.phone);
          if (profile.shippingAddress) {
            if (profile.shippingAddress.addressLine) setAddressLine(profile.shippingAddress.addressLine);
            if (profile.shippingAddress.district) setDistrict(profile.shippingAddress.district);
            if (profile.shippingAddress.city) setCity(profile.shippingAddress.city);
            if (profile.shippingAddress.ward) setWard(profile.shippingAddress.ward);
          }
        }
      }).catch(() => {
        // Token không hợp lệ hoặc hết hạn
      });
    }

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
      // Chuyển hướng hoặc mở modal bắt buộc đăng nhập
      setShowLoginModal(true);
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    // Kiểm tra bảo mật UI: Phải có token đăng nhập mới được gửi thanh toán
    const token = getToken();
    if (!token) {
      setShowCheckoutModal(false);
      setShowLoginModal(true);
      return;
    }

    if (!fullName.trim()) {
      setCheckoutError('Vui lòng nhập họ và tên người nhận.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setCheckoutError('Số điện thoại nhận hàng phải có ít nhất 8 chữ số.');
      return;
    }

    if (!addressLine.trim()) {
      setCheckoutError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    if (!district.trim()) {
      setCheckoutError('Vui lòng nhập Quận / Huyện nhận hàng.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          sellerId: i.sellerId || 'system-store',
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress: {
          name: fullName.trim(),
          phone: phone.trim(),
          line1: addressLine.trim(),
          ward: ward.trim() || undefined,
          district: district.trim(),
          province: city.trim(),
          country: 'VN',
        },
        paymentMethod,
        note: note.trim() || undefined,
      };

      const result = await cartService.checkout(payload);
      const createdOrderId = result?.id || result?.orders?.[0]?.id || result?.orderId || 'ORD-' + Date.now().toString().slice(-6);
      const createdOrderNumber = result?.orderNumber || result?.orders?.[0]?.orderNumber || createdOrderId;

      saveLocalOrder({
        id: createdOrderId,
        orderNumber: createdOrderNumber,
        status: 'CONFIRMED',
        subtotal,
        shippingFee,
        discount: 0,
        total,
        shippingAddress: {
          name: fullName.trim(),
          phone: phone.trim(),
          line1: addressLine.trim(),
          ward: ward.trim() || undefined,
          district: district.trim(),
          province: city.trim(),
          country: 'VN',
        },
        paymentMethod,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.quantity * i.unitPrice,
          imageUrl: i.imageUrl,
        })),
      });

      setItems([]);
      setShowCheckoutModal(false);

      if (paymentMethod === 'COD') {
        setOrderSuccess({ orderId: createdOrderId });
      } else {
        setPendingPayment({
          orderId: createdOrderId,
          orderNumber: createdOrderNumber,
          amount: total,
          method: paymentMethod as PaymentGatewayType,
        });
      }
    } catch (err: unknown) {
      const rawError = (err as Error)?.message || '';
      // Trường hợp backend trả về 401 Unauthorized do token hết hạn hoặc chưa đăng nhập
      if (
        rawError.includes('401') ||
        rawError.toLowerCase().includes('unauthorized') ||
        rawError.includes('đăng nhập')
      ) {
        setCheckoutError('Phiên đăng nhập đã kết thúc. Đang chuyển hướng bạn tới trang đăng nhập...');
        setTimeout(() => {
          setShowCheckoutModal(false);
          router.push('/auth/login?redirect=/shop/cart');
        }, 1200);
        return;
      }

      // Xử lý thông báo lỗi an toàn: Đảm bảo luôn luôn là string, KHÔNG BAO GIỜ gán object/array vào JSX
      let errMsg = 'Lỗi đặt hàng. Vui lòng thử lại.';
      try {
        const p = JSON.parse(rawError);
        if (Array.isArray(p.message)) {
          // Lỗi Zod validation: [{ code, expected, received, path, message }]
          errMsg = p.message
            .map((item: any) => {
              if (typeof item === 'string') return item;
              const fieldName = Array.isArray(item?.path) ? item.path.join('.') : '';
              const message = item?.message || 'Không hợp lệ';
              return fieldName ? `${fieldName}: ${message}` : message;
            })
            .join(' | ');
        } else if (typeof p.message === 'string') {
          errMsg = p.message;
        } else if (typeof p.message === 'object' && p.message !== null) {
          errMsg = p.message.message || JSON.stringify(p.message);
        } else if (typeof p.error === 'string') {
          errMsg = p.error;
        }
      } catch {
        if (typeof rawError === 'string' && rawError.trim()) {
          errMsg = rawError;
        }
      }

      setCheckoutError(String(errMsg));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentSimulatorSuccess = (details: {
    transactionId: string;
    method: PaymentGatewayType;
    paidAt: string;
  }) => {
    if (pendingPayment) {
      updateLocalOrderStatus(pendingPayment.orderId, 'CONFIRMED', 'PAID', details.paidAt);
      setOrderSuccess({ orderId: pendingPayment.orderId });
      setPendingPayment(null);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '640px' }}>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            Mã đơn hàng của bạn là <strong>#{orderSuccess.orderId}</strong>. Đơn hàng đã được ghi nhận trên hệ thống và chuyển sang bộ phận vận chuyển thiết bị y tế.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/orders/${orderSuccess.orderId}`} className="btn btn-primary" style={{ padding: '12px 22px' }}>
              Xem chi tiết đơn hàng
            </Link>
            <Link href="/orders" className="btn btn-secondary" style={{ padding: '12px 22px' }}>
              Danh sách đơn hàng
            </Link>
            <Link href="/shop/products" className="btn" style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>
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

      {/* Banner thông báo bắt buộc đăng nhập để thanh toán nếu User chưa đăng nhập */}
      {!isLoggedIn && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#92400e' }}>
                Yêu cầu đăng nhập trước khi thanh toán
              </div>
              <div style={{ fontSize: '13px', color: '#78350f', marginTop: '2px', lineHeight: 1.5 }}>
                Quý khách vui lòng đăng nhập tài khoản để xác nhận địa chỉ giao hàng, lưu đơn và kích hoạt bảo hành điện tử chính hãng.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/auth/login?redirect=/shop/cart"
              id="cart-banner-login-btn"
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogIn size={15} /> Đăng nhập ngay
            </Link>
            <Link
              href="/auth/register?redirect=/shop/cart"
              id="cart-banner-register-btn"
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={15} /> Đăng ký
            </Link>
          </div>
        </div>
      )}

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

            {/* Nút hành động thanh toán / đăng nhập */}
            {isLoggedIn ? (
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
                  fontSize: '15px',
                  fontWeight: 700,
                }}
              >
                <CreditCard size={18} />
                <span>Tiến hành thanh toán</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  id="cart-login-to-checkout-btn"
                  onClick={() => router.push('/auth/login?redirect=/shop/cart')}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#ea580c',
                    borderColor: '#c2410c',
                    fontSize: '15px',
                    fontWeight: 700,
                  }}
                >
                  <Lock size={18} />
                  <span>Đăng nhập để thanh toán</span>
                </button>
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Chưa có tài khoản?{' '}
                  <Link href="/auth/register?redirect=/shop/cart" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                    Đăng ký ngay
                  </Link>
                </div>
              </div>
            )}
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
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Vui Lòng Đăng Nhập Để Thanh Toán
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              Để kích hoạt bảo hành chính hãng 1 đổi 1 trong 24 tháng và bảo vệ quyền lợi nhận hàng, quý khách cần đăng nhập tài khoản trước khi hoàn tất đặt mua.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/auth/login?redirect=/shop/cart"
                id="cart-modal-login-btn"
                className="btn btn-primary"
                style={{ padding: '12px', justifyContent: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LogIn size={16} /> Đăng Nhập Ngay
              </Link>

              <Link
                href="/auth/register?redirect=/shop/cart"
                id="cart-modal-register-btn"
                className="btn btn-secondary"
                style={{ padding: '12px', justifyContent: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus size={16} /> Chưa có tài khoản? Đăng Ký
              </Link>

              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  textDecoration: 'underline',
                }}
              >
                Để sau, quay lại giỏ hàng
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '16px',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Thông Tin Giao Hàng &amp; Thanh Toán</h2>

            {checkoutError && (
              <div style={{
                background: 'var(--danger-light, #fee2e2)',
                color: 'var(--danger, #dc2626)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{typeof checkoutError === 'string' ? checkoutError : JSON.stringify(checkoutError)}</span>
              </div>
            )}

            {/* Thanh chọn nhanh hồ sơ người nhận mẫu */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '14px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                ⚡ Điền nhanh thông tin người nhận mẫu:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEMO_ACCOUNTS.slice(0, 3).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setFullName(acc.fullName);
                      setPhone(acc.phone);
                      setAddressLine(acc.address.addressLine);
                      setDistrict(acc.address.district);
                      setCity(acc.address.city);
                      setWard(acc.address.ward);
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      color: '#0f172a',
                    }}
                  >
                    {acc.avatar} {acc.fullName}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleConfirmCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Họ và tên người nhận</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Địa chỉ nhận hàng (Số nhà, tên đường) *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Số 123 Đường Nguyễn Trãi"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Quận / Huyện *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận 1"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Tỉnh / Thành phố *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Phường / Xã (tùy chọn)</label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Phường Bến Nghé"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Ghi chú đơn hàng (tùy chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Phương thức thanh toán</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
                    { key: 'VNPAY', label: 'Cổng VNPay (QR & Thẻ ATM Sandbox)' },
                    { key: 'MOMO', label: 'Ví điện tử MoMo (Sandbox Test)' },
                    { key: 'BANK_TRANSFER', label: 'Chuyển khoản VietQR 24/7 (Quét mã tự động)' },
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

      {/* Payment Simulator Modal */}
      {pendingPayment && (
        <PaymentSimulatorModal
          isOpen={!!pendingPayment}
          orderId={pendingPayment.orderId}
          orderNumber={pendingPayment.orderNumber}
          amount={pendingPayment.amount}
          initialMethod={pendingPayment.method}
          onClose={() => {
            // Close simulator and still allow buyer to view order
            const oid = pendingPayment.orderId;
            setPendingPayment(null);
            setOrderSuccess({ orderId: oid });
          }}
          onSuccess={handlePaymentSimulatorSuccess}
        />
      )}
    </div>
  );
}
