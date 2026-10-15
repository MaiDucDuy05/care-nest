'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type SubscriptionDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatCurrency } from '@/lib/format';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success', PAUSED: 'warning', CANCELLED: 'danger', EXPIRED: 'danger', PENDING: 'default',
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subId = params.id as string;
  const { token } = useAuth();
  const t = useTranslations('subscriptions');
  const [data, setData] = useState<SubscriptionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.subscriptions.getById(subId, token ?? undefined)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subId]);

  if (loading) return <div><Skeleton width="200px" height="32px" /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Subscription not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{data.id}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('user')}:</span> <span>{data.userName}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('plan')}:</span> <Badge variant="secondary">{data.planName}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('status')}:</span> <Badge variant={statusVariant[data.status] || 'default'}>{t(`statuses.${data.status}`)}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('interval')}:</span> {t(`intervals.${data.interval}`)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Price:</span> <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(data.priceVnd)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('currentPeriodStart')}:</span> {formatDateTime(data.currentPeriodStart)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('currentPeriodEnd')}:</span> {formatDateTime(data.currentPeriodEnd)}</div>
          {data.cancelledAt && <div><span style={{ color: 'var(--text-muted)' }}>{t('cancelledAt')}:</span> {formatDateTime(data.cancelledAt)}</div>}
        </div>
      </div>
    </div>
  );
}

const t = { user: 'User', plan: 'Plan', status: 'Status', interval: 'Interval', currentPeriodStart: 'Period Start', currentPeriodEnd: 'Period End', cancelledAt: 'Cancelled At', statuses: { ACTIVE: 'Active', PAUSED: 'Paused', CANCELLED: 'Cancelled', EXPIRED: 'Expired', PENDING: 'Pending' }, intervals: { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' } };
