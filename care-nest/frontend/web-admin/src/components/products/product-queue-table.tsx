'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { ProductAdmin } from '@/lib/api-client';

interface ProductQueueTableProps {
  data: ProductAdmin[];
  loading?: boolean;
  onView: (item: ProductAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductQueueTable({ data, loading, onView, page, totalPages, onPageChange }: ProductQueueTableProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'name', header: t('productName'), render: (r) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {r.images?.[0] ? (
                <img src={r.images[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
              )}
              <div>
                <div style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {r.id.slice(0, 8)}</div>
              </div>
            </div>
          )},
          { key: 'sellerName', header: t('seller'), render: (r) => (
            <div>
              <div style={{ fontWeight: 500 }}>{r.sellerName}</div>
            </div>
          )},
          { key: 'category', header: t('category'), render: (r) => <Badge variant="secondary">{r.category}</Badge> },
          { key: 'price', header: t('price'), render: (r) => <span style={{ fontWeight: 600 }}>{formatCurrency(r.priceVnd)}</span> },
          { key: 'createdAt', header: tCommon('createdAt'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="primary" onClick={() => onView(r)}>
              {tCommon('viewDetails')}
            </Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={
          <EmptyState title={t('noPending')} description={t('noPendingDesc')} icon="📦" />
        }
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
