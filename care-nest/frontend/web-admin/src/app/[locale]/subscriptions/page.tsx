'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type SubscriptionAdmin, type MrrResponse, type ChurnResponse, type PlanDistributionResponse } from '@/lib/api-client';
import { KpiGrid } from '@/components/kpi/kpi-grid';
import { KpiCard } from '@/components/kpi/kpi-card';
import { SubscriptionTable } from '@/components/subscriptions/subscription-table';
import { MrrChart } from '@/components/subscriptions/mrr-chart';
import { ChurnChart } from '@/components/subscriptions/churn-chart';
import { PlanDistribution } from '@/components/subscriptions/plan-distribution';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const router = useRouter();
  const [subs, setSubs] = useState<SubscriptionAdmin[]>([]);
  const [mrr, setMrr] = useState<MrrResponse | null>(null);
  const [churn, setChurn] = useState<ChurnResponse | null>(null);
  const [distribution, setDistribution] = useState<PlanDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, c, d] = await Promise.all([
        apiClient.subscriptions.list({ page: 1, limit: 50 }),
        apiClient.subscriptions.mrr(),
        apiClient.subscriptions.churn(),
        apiClient.subscriptions.planDistribution(),
      ]);
      setSubs(s.data);
      setTotalPages(s.totalPages);
      setMrr(m);
      setChurn(c);
      setDistribution(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeCount = subs.filter((s) => s.status === 'ACTIVE').length;
  const pausedCount = subs.filter((s) => s.status === 'PAUSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      {/* KPI */}
      <KpiGrid>
        <KpiCard title={t('mrr')} value={mrr ? `${(mrr.current / 1000000).toFixed(1)}M VND` : '—'} description={t('mrrDesc')} icon="💰" variant="primary" />
        <KpiCard title={t('churn')} value={churn ? `${churn.current.toFixed(1)}%` : '—'} description={t('churnDesc')} icon="📉" variant="danger" />
        <KpiCard title={t('activeSubs')} value={activeCount} icon="✅" variant="success" />
        <KpiCard title={t('pausedSubs')} value={pausedCount} icon="⏸" variant="warning" />
      </KpiGrid>

      {/* Charts */}
      {mrr && <MrrChart data={mrr.history} />}
      {churn && <ChurnChart data={churn.history} />}
      {distribution && distribution.distribution.length > 0 && <PlanDistribution distribution={distribution.distribution} />}

      {/* Table */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{t('totalSubs')}</h2>
        <SubscriptionTable
          data={subs}
          loading={loading}
          onView={(item) => router.push(`/subscriptions/${item.id}`)}
          page={page}
          totalPages={totalPages}
          onPageChange={() => {}}
        />
      </div>
    </div>
  );
}
