'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { SubscriptionAdmin } from '@/lib/api-client';

interface SubscriptionTableProps {
  data: SubscriptionAdmin[];
  loading?: boolean;
  onView: (item: SubscriptionAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  CANCELLED: 'danger',
  EXPIRED: 'danger',
  PENDING: 'default',
};

export function SubscriptionTable({ data, loading, onView, page, totalPages, onPageChange }: SubscriptionTableProps) {
  const t = useTranslations('subscriptions');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'id', header: t('subscriptionId'), width: '200px', render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.id.slice(0, 8)}...</span>
          )},
          { key: 'user', header: t('user'), render: (r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.userName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.userEmail}</div>
            </div>
          )},
          { key: 'plan', header: t('plan'), render: (r) => <Badge variant="secondary">{r.planName}</Badge> },
          { key: 'interval', header: t('interval'), render: (r) => t(`intervals.${r.interval}`) },
          { key: 'status', header: t('status'), render: (r) => (
            <Badge variant={statusVariant[r.status] || 'default'}>{t(`statuses.${r.status}`)}</Badge>
          )},
          { key: 'price', header: t('totalRevenue'), render: (r) => <span style={{ fontWeight: 700 }}>{formatCurrency(r.priceVnd)}</span> },
          { key: 'periodEnd', header: t('currentPeriodEnd'), render: (r) => formatDateTime(r.currentPeriodEnd) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="outline" onClick={() => onView(r)}>{tCommon('viewDetails')}</Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={<EmptyState title={t('noSubscriptions')} description={t('noSubscriptionsDesc')} icon="💳" />}
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
