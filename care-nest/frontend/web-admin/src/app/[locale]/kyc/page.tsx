'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type KycDocumentAdmin } from '@/lib/api-client';
import { KycQueueTable } from '@/components/kyc/kyc-queue-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function KycPage() {
  const t = useTranslations('kyc');
  const router = useRouter();
  const [data, setData] = useState<KycDocumentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.kyc.listPending({ page: p, limit: 50 });
      setData(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  if (data.length === 0 && !loading) {
    fetchData();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <KycQueueTable
        data={data}
        loading={loading}
        onView={(item) => router.push(`/kyc/${item.userId}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
