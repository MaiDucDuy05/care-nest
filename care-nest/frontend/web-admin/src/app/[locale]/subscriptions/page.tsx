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
import { useAuth } from '@/lib/hooks/use-auth';

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [subs, setSubs] = useState<SubscriptionAdmin[]>([]);
  const [mrr, setMrr] = useState<MrrResponse | null>(null);
  const [churn, setChurn] = useState<ChurnResponse | null>(null);
  const [distribution, setDistribution] = useState<PlanDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [pastDueCount, setPastDueCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (authLoading) return;
    if (!token) {
      setError('No admin access token is available. Please sign in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, m, c, d] = await Promise.all([
        apiClient.subscriptions.list({ page: 1, limit: 50 }, token),
        apiClient.subscriptions.mrr(token),
        apiClient.subscriptions.churn(token),
        apiClient.subscriptions.planDistribution(token),
      ]);
      setSubs(s.data);
      setTotalPages(s.totalPages);
      setMrr(m);
      setChurn(c);
      setDistribution(d);
      setActiveCount(s.statusCounts.ACTIVE ?? 0);
      setPastDueCount(s.statusCounts.PAST_DUE ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  }, [authLoading, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
        <KpiCard title={t('pastDueSubs')} value={pastDueCount} icon="⏸" variant="warning" />
      </KpiGrid>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', color: 'var(--danger)', background: 'var(--danger-light)', fontSize: '13px', overflowWrap: 'anywhere' }}>
          {error}
        </div>
      )}

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
