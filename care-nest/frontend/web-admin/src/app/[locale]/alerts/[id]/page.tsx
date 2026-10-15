'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type AlertDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/components/ui/toast';

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'default',
};

export default function AlertDetailPage() {
  const t = useTranslations('alerts');
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<AlertDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await apiClient.alerts.getById(alertId, token ?? undefined);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [alertId]);

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><Skeleton width="200px" height="32px" /></div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Alert not found</div>;
  }

  async function handleAck() {
    try {
      await apiClient.alerts.ack(alertId, token ?? undefined);
      toast('success', t('acknowledgeSuccess'));
      fetchData();
    } catch {
      toast('error', 'Error');
    }
  }

  async function handleResolve() {
    try {
      await apiClient.alerts.resolve(alertId, token ?? undefined);
      toast('success', t('resolveSuccess'));
      fetchData();
    } catch {
      toast('error', 'Error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <Badge variant={severityVariant[data.severity] || 'default'}>{t(`severities.${data.severity}`)}</Badge>
          <Badge variant="secondary">{t(`types.${data.type}`)}</Badge>
          {data.status === 'ACKNOWLEDGED' && <Badge variant="info">{t('acknowledged')}</Badge>}
          {data.status === 'RESOLVED' && <Badge variant="success">{t('resolved')}</Badge>}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{data.message}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('user')}:</span> {data.userName || '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('device')}:</span> {data.deviceId || '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('createdAt')}:</span> {formatDateTime(data.createdAt)}</div>
          {data.acknowledgedAt && <div><span style={{ color: 'var(--text-muted)' }}>{t('acknowledgedAt')}:</span> {formatDateTime(data.acknowledgedAt)}</div>}
          {data.resolvedAt && <div><span style={{ color: 'var(--text-muted)' }}>{t('resolvedAt')}:</span> {formatDateTime(data.resolvedAt)}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {data.status === 'PENDING' && <Button variant="outline" onClick={handleAck}>✓ {t('acknowledge')}</Button>}
        {data.status !== 'RESOLVED' && <Button variant="primary" onClick={handleResolve}>✅ {t('resolve')}</Button>}
      </div>
    </div>
  );
}
