'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/format';
import type { KycDocumentAdmin } from '@/lib/api-client';

interface KycQueueTableProps {
  data: KycDocumentAdmin[];
  loading?: boolean;
  onView: (item: KycDocumentAdmin) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function KycQueueTable({ data, loading, onView, page, totalPages, onPageChange }: KycQueueTableProps) {
  const t = useTranslations('kyc');
  const tCommon = useTranslations('common');

  return (
    <>
      <DataTable
        columns={[
          { key: 'sellerId', header: t('sellerId'), width: '200px' },
          { key: 'fullName', header: t('seller'), render: (r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{r.userFullName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.userEmail}</div>
            </div>
          )},
          { key: 'type', header: t('documentType'), render: (r) => {
            const map: Record<string, string> = { IDENTITY_CARD: 'kyc.identityCard', PASSPORT: 'kyc.passport', DRIVERS_LICENSE: 'kyc.driversLicense', HEALTH_INSURANCE: 'kyc.healthInsurance', OTHER: 'kyc.other' };
            return <Badge variant="info">{t(map[r.type] || 'kyc.other')}</Badge>;
          }},
          { key: 'filename', header: 'File', render: (r) => r.filename ? (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {r.filename}
            </span>
          ) : '—' },
          { key: 'createdAt', header: tCommon('createdAt'), render: (r) => formatDateTime(r.createdAt) },
          { key: 'actions', header: tCommon('actions'), render: (r) => (
            <Button size="sm" variant="primary" onClick={() => onView(r)}>
              {t('viewDocument')}
            </Button>
          )},
        ]}
        data={data}
        loading={loading}
        empty={
          <EmptyState
            title={t('noPending')}
            description={t('noPendingDesc')}
            icon="🪪"
          />
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
