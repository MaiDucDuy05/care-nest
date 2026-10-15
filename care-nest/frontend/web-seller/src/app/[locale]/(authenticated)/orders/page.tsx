'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ordersService } from '@/lib/services/orders.service';
import type { Order, OrderStatus } from '@/lib/types';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'badge-amber',
  CONFIRMED: 'badge-indigo',
  PACKING: 'badge-indigo',
  SHIPPED: 'badge-teal',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
};

export default function OrdersListPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await ordersService.list({ status: statusFilter || undefined });
        if (mounted) setItems(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 className="text-h2">{t('title')}</h1>

      <div className="card" style={{ display: 'flex', gap: 12 }}>
        <select
          className="select"
          style={{ width: 220 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
        >
          <option value="">Tất cả trạng thái</option>
          {(['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--text-muted)' }}>
            <div className="spinner" /> {tCommon('loading')}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('empty')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('id')}</th>
                <th>{t('buyer')}</th>
                <th>{t('total')}</th>
                <th>{t('status')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{o.buyerName}</td>
                  <td style={{ fontWeight: 600 }}>{formatVnd(o.totalVnd)}</td>
                  <td>
                    <span className={`badge ${STATUS_COLOR[o.status]}`}>{t(`statuses.${o.status}`)}</span>
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(o.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <Link href={`/orders/${o.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>
                      {t('view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
