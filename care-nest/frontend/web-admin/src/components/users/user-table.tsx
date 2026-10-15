'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { UserAdmin } from '@/lib/api-client';

interface UserTableProps {
  data: UserAdmin[];
  loading?: boolean;
  onView: (item: UserAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const statusVariant: Record<string, 'success' | 'danger' | 'warning'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  PENDING: 'warning',
};

export function UserTable({ data, loading, onView, page, totalPages, onPageChange }: UserTableProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'id', header: t('userId'), width: '200px', render: (r) => (
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.id.slice(0, 8)}...</span>
          )},
          { key: 'fullName', header: t('fullName'), render: (r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.fullName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.email}</div>
            </div>
          )},
          { key: 'phone', header: t('phone'), render: (r) => r.phone || '—' },
          { key: 'role', header: t('role'), render: (r) => (
            <Badge variant={r.role === 'ADMIN' ? 'danger' : r.role === 'SELLER' ? 'secondary' : 'default'}>
              {t(`roles.${r.role}`)}
            </Badge>
          )},
          { key: 'status', header: t('status'), render: (r) => (
            <Badge variant={statusVariant[r.status] || 'default'}>{t(r.status.toLowerCase() as 'active' | 'suspended')}</Badge>
          )},
          { key: 'totalOrders', header: t('totalOrders'), render: (r) => r.totalOrders ?? 0 },
          { key: 'totalSpent', header: t('totalSpent'), render: (r) => r.totalSpentVnd ? formatCurrency(r.totalSpentVnd) : '—' },
          { key: 'createdAt', header: t('joinedAt'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="outline" onClick={() => onView(r)}>
              {tCommon('viewDetails')}
            </Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={<EmptyState title={t('noUsers')} description={t('noUsersDesc')} icon="👥" />}
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
