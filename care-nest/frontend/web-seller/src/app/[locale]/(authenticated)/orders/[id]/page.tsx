'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ChevronLeft, Package, ScanLine } from 'lucide-react';
import { ordersService } from '@/lib/services/orders.service';
import type { Order } from '@/lib/types';

const formatShippingAddress = (address: Order['shippingAddress']) => {
  if (typeof address === 'string') return address;
  return [
    address.addressLine || address.line1,
    address.ward,
    address.district,
    address.province,
    address.country,
  ].filter(Boolean).join(', ');
};

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await ordersService.getById(params.id);
        if (mounted) setOrder(data);
      } catch (err) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        <div className="spinner" /> {tCommon('loading')}
      </div>
    );
  }
  if (error || !order) {
    return <div className="card" style={{ color: 'var(--danger)' }}>{error ?? 'Order not found'}</div>;
  }

  const isOnlineUnpaid = order.paymentMethod && order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID';
  const canPack = order.status === 'CONFIRMED' || (order.status === 'CREATED' && order.paymentMethod === 'COD');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <Link href="/orders" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> {tCommon('back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2">{order.orderNumber}</h1>
          <p className="text-muted text-sm">
            {t('createdAt')}: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <span className="badge badge-indigo">{t(`statuses.${order.status}`)}</span>
      </div>

      {/* Thông tin thanh toán */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="text-muted text-sm">Phương thức thanh toán</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod || 'Online'}
          </div>
        </div>
        <div>
          <div className="text-muted text-sm" style={{ textAlign: 'right' }}>Trạng thái thanh toán</div>
          <div style={{ textAlign: 'right', marginTop: 4 }}>
            {order.paymentMethod === 'COD' ? (
              <span className="badge badge-teal">Thu tiền khi giao (COD)</span>
            ) : order.paymentStatus === 'PAID' ? (
              <span className="badge badge-green">Đã thanh toán</span>
            ) : order.paymentStatus === 'FAILED' ? (
              <span className="badge badge-red">Thanh toán thất bại</span>
            ) : (
              <span className="badge badge-amber">Chờ người mua thanh toán</span>
            )}
          </div>
        </div>
      </div>

      {isOnlineUnpaid && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', color: '#92400e', fontSize: '13px' }}>
          ⚠️ <strong>Đơn hàng chưa thanh toán:</strong> Khách hàng chọn hình thức thanh toán online qua <strong>{order.paymentMethod}</strong> nhưng chưa thanh toán thành công. Vui lòng không đóng gói hay gửi hàng cho tới khi khách thanh toán hoàn tất.
        </div>
      )}

      <div className="card">
        <h2 className="text-h3" style={{ marginBottom: 12 }}>
          {t('buyer')}
        </h2>
        <p>{order.buyerName ?? order.buyerId}</p>
        {typeof order.shippingAddress !== 'string' && order.shippingAddress.phone && (
          <p className="text-muted text-sm">{order.shippingAddress.phone}</p>
        )}
        <p className="text-muted text-sm">{formatShippingAddress(order.shippingAddress)}</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{tCommon('edit') /* product column header */}</th>
              <th>Số lượng</th>
              <th>{t('total')}</th>
              <th>IMEI đã gán</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={16} color="var(--text-muted)" />
                    {it.productName}
                  </div>
                </td>
                <td>{it.quantity}</td>
                <td>{formatVnd((it.priceVnd ?? it.unitPriceVnd ?? 0) * it.quantity)}</td>
                <td>
                  {(it.imeis ?? []).length > 0 ? (
                    <span className="badge badge-green">{(it.imeis ?? []).length} IMEI</span>
                  ) : (
                    <span className="text-muted text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="text-h3">
          {t('total')}: <span style={{ color: 'var(--primary)' }}>{formatVnd(order.totalVnd)}</span>
        </div>
        {canPack && (
          <Link href={`/orders/${order.id}/pack`} className="btn btn-primary">
            <ScanLine size={16} /> {t('pack')}
          </Link>
        )}
      </div>
    </div>
  );
}
