'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { OrderAdmin } from '@/lib/api-client';

interface OrderTableProps {
  data: OrderAdmin[];
  loading?: boolean;
  onView: (item: OrderAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
  CREATED: 'warning',
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKING: 'info',
  SHIPPED: 'info',
  PICKED_UP: 'info',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  RETURN_REQUESTED: 'warning',
  RETURNED: 'default',
};

export function OrderTable({ data, loading, onView, page, totalPages, onPageChange }: OrderTableProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'id', header: t('orderId'), width: '200px', render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.id}</span>
          )},
          { key: 'buyer', header: t('buyer'), render: (r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.buyerName}</div>
            </div>
          )},
          { key: 'seller', header: t('seller'), render: (r) => (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.sellerName}</div>
          )},
          { key: 'status', header: t('status'), render: (r) => (
            <Badge variant={statusVariant[r.status] || 'default'}>
              {t(`statuses.${r.status}`)}
            </Badge>
          )},
          { key: 'total', header: t('totalAmount'), render: (r) => (
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(r.totalVnd)}</span>
          )},
          { key: 'payment', header: t('paymentMethod'), render: (r) => (
            <span style={{ fontSize: '13px' }}>{r.paymentMethod}</span>
          )},
          { key: 'createdAt', header: t('createdAt'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="outline" onClick={() => onView(r)}>
              {tCommon('viewDetails')}
            </Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={<EmptyState title={t('noOrders')} description={t('noOrdersDesc')} icon="🧾" />}
        rowKey={(r) => r.id}
      />
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</Button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {tCommon('page')} {page} {tCommon('of')} {totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</Button>
        </div>
      )}
    </>
  );
}
