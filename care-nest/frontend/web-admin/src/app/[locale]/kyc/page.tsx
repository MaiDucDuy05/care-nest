'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type KycDocumentAdmin } from '@/lib/api-client';
import { KycQueueTable } from '@/components/kyc/kyc-queue-table';
import { useAuth } from '@/lib/hooks/use-auth';

export default function KycPage() {
  const t = useTranslations('kyc');
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<KycDocumentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.kyc.listPending({ page: p, limit: 50 }, token ?? undefined);
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
      setPage(res.page || 1);
    } catch (err) {
      console.error('Failed to fetch pending KYC:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      fetchData(1);
    }
  }, [authLoading, fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <KycQueueTable
        data={data}
        loading={loading}
        onView={(item) => router.push(`/kyc/${item.id || item.userId}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
