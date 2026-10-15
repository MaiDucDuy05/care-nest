'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { ShipmentAdmin } from '@/lib/api-client';

interface ShipmentTableProps {
  data: ShipmentAdmin[];
  loading?: boolean;
  onView: (item: ShipmentAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  DELIVERED: 'success',
  PENDING: 'warning',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  PICKED_UP: 'info',
  CANCELLED: 'danger',
  RETURNED: 'danger',
  FAILED: 'danger',
  RETURN_REQUESTED: 'warning',
};

export function ShipmentTable({ data, loading, onView, page, totalPages, onPageChange }: ShipmentTableProps) {
  const t = useTranslations('shipping');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'id', header: t('shipmentId'), width: '200px', render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.id.slice(0, 8)}...</span>
          )},
          { key: 'tracking', header: t('trackingNumber'), render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.trackingNumber || '—'}</span>
          )},
          { key: 'user', header: t('user'), render: (r) => (
            <div style={{ fontWeight: 600 }}>{r.userName}</div>
          )},
          { key: 'carrier', header: t('carrier'), render: (r) => (
            <Badge variant="secondary">{t(`providers.${r.carrierCode}`)}</Badge>
          )},
          { key: 'status', header: t('status'), render: (r) => (
            <Badge variant={statusVariant[r.status] || 'default'}>{t(`statuses.${r.status}`)}</Badge>
          )},
          { key: 'fee', header: t('shippingFee'), render: (r) => formatCurrency(r.shippingFeeVnd) },
          { key: 'estimated', header: t('estimatedDelivery'), render: (r) => r.estimatedDeliveryAt ? formatDateTime(r.estimatedDeliveryAt) : '—' },
          { key: 'createdAt', header: tCommon('createdAt'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="outline" onClick={() => onView(r)}>{tCommon('viewDetails')}</Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={<EmptyState title={t('noShipments')} description={t('noShipmentsDesc')} icon="🚚" />}
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
