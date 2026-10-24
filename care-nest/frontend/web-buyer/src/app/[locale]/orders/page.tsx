'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Star,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Lock,
  Search,
} from 'lucide-react';
import { ordersService, type Order, type OrderStatus } from '@/services/orders.service';
import { cartService, emitCartUpdated } from '@/services/cart.service';
import { getToken } from '@/lib/api-client';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

const formatDate = (isoString: string) => {
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

type TabFilter = 'ALL' | 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const token = getToken();
    setIsLoggedIn(!!token);

    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await ordersService.listOrders();
        if (isMounted) {
          setOrders(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mua lại các sản phẩm trong đơn hàng
  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
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
      const updatedCart = await cartService.getCart();
      emitCartUpdated(updatedCart);
      router.push('/shop/cart');
    } catch (err) {
      console.error('Lỗi khi mua lại đơn hàng:', err);
    } finally {
      setReorderingId(null);
    }
  };

  // Lọc theo Tab trạng thái
  const filteredOrders = orders.filter((order) => {
    // Lọc theo Tab
    if (activeTab === 'PENDING') {
      if (order.status !== 'CREATED' && order.status !== 'CONFIRMED' && order.status !== 'PACKING') {
        return false;
      }
    } else if (activeTab === 'SHIPPING') {
      if (order.status !== 'SHIPPED') return false;
    } else if (activeTab === 'DELIVERED') {
      if (order.status !== 'DELIVERED') return false;
    } else if (activeTab === 'CANCELLED') {
      if (order.status !== 'CANCELLED' && order.status !== 'RETURNED') return false;
    }

    // Lọc theo ô tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = (order.orderNumber || order.id).toLowerCase().includes(q);
      const matchProduct = order.items.some((i) =>
        (i.productName || i.name || '').toLowerCase().includes(q)
      );
      return matchNumber || matchProduct;
    }

    return true;
  });

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '1000px' }}>
      {/* Breadcrumb & Tiêu đề */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/shop/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={16} /> Quay lại cửa hàng
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Đơn Hàng Của Tôi
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Theo dõi tiến trình vận chuyển, bảo hành thiết bị y tế và lịch sử mua sắm.
            </p>
          </div>

          {/* Ô tìm kiếm đơn hàng */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Tìm theo mã đơn hoặc sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-md, 10px)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* Cảnh báo nếu chưa đăng nhập */}
      {!isLoggedIn && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={20} color="#b45309" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>
                Bạn chưa đăng nhập tài khoản
              </div>
              <div style={{ fontSize: '13px', color: '#78350f' }}>
                Đăng nhập để xem đầy đủ lịch sử đơn hàng đã đặt và kích hoạt bảo hành điện tử chính hãng.
              </div>
            </div>
          </div>
          <Link href="/auth/login?redirect=/orders" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* Thanh Tabs lọc trạng thái */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ xử lý' },
          { key: 'SHIPPING', label: 'Đang vận chuyển' },
          { key: 'DELIVERED', label: 'Đã giao thành công' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabFilter)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Nội dung danh sách đơn hàng */}
      {isLoading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--bg-card-subtle, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--text-muted)',
            }}
          >
            <Package size={36} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Chưa có đơn hàng nào</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px' }}>
            {activeTab === 'ALL'
              ? 'Bạn chưa đặt mua thiết bị y tế nào. Hãy bắt đầu chọn sắm để chăm sóc sức khỏe gia đình.'
              : 'Không tìm thấy đơn hàng nào ở trạng thái này.'}
          </p>
          <Link href="/shop/products" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            Khám phá thiết bị y tế
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const statusMeta = ordersService.getStatusMeta(order.status);
            return (
              <div
                key={order.id}
                className="card"
                style={{
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-lg, 16px)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Header đơn hàng: Mã đơn, ngày đặt, trạng thái */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                      #{order.orderNumber || order.id}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        color: statusMeta.color,
                        background: statusMeta.bg,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
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
                            <Package size={24} style={{ color: 'var(--primary)' }} />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', color: 'var(--text-main)' }}>
                            {item.productName || item.name}
                          </h4>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Số lượng: x{item.quantity} · {formatVnd(item.unitPrice)}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatVnd((item.lineTotal || item.unitPrice * item.quantity))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer đơn hàng: Tổng tiền & Các nút hành động */}
                <div
                  style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thành tiền:</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatVnd(order.total || order.subtotal)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Nút đánh giá nếu đã nhận hàng */}
                    {order.status === 'DELIVERED' && (
                      <Link
                        href={`/orders/${order.id}/review`}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Star size={15} style={{ color: '#d97706' }} /> Đánh giá
                      </Link>
                    )}

                    {/* Nút mua lại */}
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order.id}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {reorderingId === order.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Đang thêm...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} /> Mua lại
                        </>
                      )}
                    </button>

                    {/* Nút xem chi tiết */}
                    <Link
                      href={`/orders/${order.id}`}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

