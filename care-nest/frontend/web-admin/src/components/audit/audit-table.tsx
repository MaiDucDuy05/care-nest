'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/format';
import type { AuditEventAdmin } from '@/lib/api-client';

interface AuditTableProps {
  data: AuditEventAdmin[];
  loading?: boolean;
  onView: (item: AuditEventAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const actionVariant: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default' | 'secondary'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  ACTIVATE: 'success',
  DEACTIVATE: 'warning',
  LOGIN: 'secondary',
  LOGOUT: 'secondary',
  EXPORT: 'secondary',
  IMPORT: 'secondary',
  APPROVE: 'success',
  REJECT: 'danger',
};

export function AuditTable({ data, loading, onView, page, totalPages, onPageChange }: AuditTableProps) {
  const t = useTranslations('audit');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'id', header: t('eventId'), width: '200px', render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{r.id.slice(0, 8)}...</span>
          )},
          { key: 'actor', header: t('actor'), render: (r) => (
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.actorName || r.actorEmail}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.actorEmail}</div>
            </div>
          )},
          { key: 'action', header: t('action'), render: (r) => (
            <Badge variant={actionVariant[r.action] || 'default'}>
              {t(`actions.${r.action}`)}
            </Badge>
          )},
          { key: 'entityType', header: t('entityType'), render: (r) => (
            <Badge variant="secondary">{t(`entityTypes.${r.entityType}`) || r.entityType}</Badge>
          )},
          { key: 'entityId', header: t('entityId'), render: (r) => (
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.entityId.slice(0, 12)}...</span>
          )},
          { key: 'timestamp', header: t('timestamp'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="ghost" onClick={() => onView(r)}>
              {t('viewDiff')}
            </Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={<EmptyState title={t('noEvents')} description={t('noEventsDesc')} icon="📋" />}
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
