'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  CreditCard,
  FileText,
  Star,
  RotateCcw,
  ShoppingBag,
  Loader2,
  ShieldCheck,
  Phone,
  User,
} from 'lucide-react';
import { ordersService, type Order } from '@/services/orders.service';
import { cartService, emitCartUpdated } from '@/services/cart.service';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

const formatDate = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!orderId) return;

    async function fetchDetail() {
      setIsLoading(true);
      try {
        const data = await ordersService.getOrder(orderId);
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Lỗi tải chi tiết đơn hàng:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleReorder = async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      for (const item of order.items) {
        await cartService.addItem({
          productId: item.productId,
          sellerId: order.sellerId || 'system-store',
          name: item.productName || item.name || 'Thiết bị y tế',
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        });
      }
      const updated = await cartService.getCart();
      emitCartUpdated(updated);
      router.push('/shop/cart');
    } catch (err) {
      console.error('Lỗi khi mua lại đơn hàng:', err);
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Đang tải thông tin chi tiết đơn hàng #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '600px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px 24px' }}>
          <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.6 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Không tìm thấy đơn hàng</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Đơn hàng #{orderId} có thể không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <Link href="/orders" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            Về danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = ordersService.getStatusMeta(order.status);
  const currentStep = statusMeta.step;

  const addr = order.shippingAddress || {};
  const fullAddress = [addr.line1, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(', ');

  const steps = [
    { label: 'Đặt hàng thành công', step: 1, icon: CheckCircle2 },
    { label: 'Xác nhận & Đóng gói', step: 2, icon: Package },
    { label: 'Đang vận chuyển', step: 3, icon: Truck },
    { label: 'Giao hàng thành công', step: 4, icon: CheckCircle2 },
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '960px' }}>
      {/* Quay lại danh sách đơn hàng */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={16} /> Danh sách đơn hàng
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Chi Tiết Đơn Hàng #{order.orderNumber || order.id}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Ngày đặt: {formatDate(order.createdAt)}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '20px',
                color: statusMeta.color,
                background: statusMeta.bg,
              }}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Tiến trình đơn hàng (Stepper) */}
      {order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-main)' }}>
            Tiến Trình Đơn Hàng
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {steps.map((s, idx) => {
              const isCompleted = currentStep >= s.step;
              const isCurrent = currentStep === s.step;
              const IconComp = s.icon;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--primary)' : 'var(--bg-card-subtle, #f1f5f9)',
                      color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrent ? '0 0 0 4px var(--primary-light, #ccfbf1)' : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    <IconComp size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isCurrent ? 800 : isCompleted ? 600 : 400,
                      color: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--text-main)' : 'var(--text-muted)',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Cột trái: Danh sách sản phẩm & Thông tin nhận hàng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Danh sách sản phẩm */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} style={{ color: 'var(--primary)' }} />
              <span>Sản Phẩm Đã Mua ({order.items.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: index < order.items.length - 1 ? '16px' : '0',
                    borderBottom: index < order.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'var(--bg-card-subtle, #f1f5f9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName || item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={28} style={{ color: 'var(--primary)' }} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        {item.productName || item.name}
                      </h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Đơn giá: {formatVnd(item.unitPrice)} · Số lượng: x{item.quantity}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {formatVnd(item.lineTotal || item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin giao hàng & người nhận */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <span>Địa Chỉ Giao Hàng</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-main)' }}>
                <User size={15} style={{ color: 'var(--text-muted)' }} />
                <span>{addr.name || 'Người nhận'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Phone size={15} />
                <span>{addr.phone || 'Chưa cung cấp SĐT'}</span>
              </div>
              <div style={{ color: 'var(--text-main)', marginTop: '4px' }}>
                {fullAddress || 'Địa chỉ giao hàng'}
              </div>
              {order.note && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--bg-card-subtle, #f8fafc)', borderRadius: 'var(--radius-sm, 6px)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <strong>Ghi chú:</strong> {order.note}
                </div>
              )}
            </div>
          </div>

          {/* Cam kết y tế */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success, #059669)', fontSize: '13px' }}>
            <ShieldCheck size={20} /> Thiết bị được bảo hành chính hãng 1 đổi 1 trong 24 tháng theo số serial điện tử.
          </div>
        </div>

        {/* Cột phải: Tóm tắt thanh toán & Các hành động */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: 'var(--primary)' }} />
              <span>Chi Phí &amp; Thanh Toán</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tạm tính:</span>
                <span style={{ fontWeight: 600 }}>{formatVnd(order.subtotal || order.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phí vận chuyển:</span>
                <span style={{ color: (order.shippingFee ?? 0) === 0 ? 'var(--success)' : undefined, fontWeight: 600 }}>
                  {(order.shippingFee ?? 0) === 0 ? 'Miễn phí' : formatVnd(order.shippingFee)}
                </span>
              </div>
              {order.discount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Giảm giá:</span>
                  <span style={{ fontWeight: 600 }}>-{formatVnd(order.discount)}</span>
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  fontWeight: 800,
                  fontSize: '17px',
                }}
              >
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--primary)' }}>{formatVnd(order.total || order.subtotal)}</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-subtle, #f8fafc)', borderRadius: 'var(--radius-md, 8px)', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Phương thức thanh toán:</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {order.paymentMethod === 'VNPAY'
                  ? 'Cổng thanh toán VNPAY'
                  : order.paymentMethod === 'MOMO'
                  ? 'Ví điện tử MoMo'
                  : order.paymentMethod === 'BANK_TRANSFER'
                  ? 'Chuyển khoản ngân hàng'
                  : 'Thanh toán khi nhận hàng (COD)'}
              </div>
            </div>

            {/* Các nút hành động */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Nút đánh giá review sản phẩm */}
              <Link
                href={`/orders/${order.id}/review`}
                className="btn btn-secondary"
                style={{ padding: '11px', justifyContent: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Star size={16} style={{ color: '#d97706' }} /> Đánh giá đơn hàng
              </Link>

              {/* Nút mua lại */}
              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="btn btn-primary"
                style={{ padding: '11px', justifyContent: 'center', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isReordering ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang thêm vào giỏ...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} /> Mua lại đơn này
                  </>
                )}
              </button>

              <Link
                href="/shop/products"
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  marginTop: '4px',
                }}
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

