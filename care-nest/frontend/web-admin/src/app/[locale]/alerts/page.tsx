'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type AlertAdmin } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLiveAlerts } from '@/lib/hooks/use-live-alerts';
import { AlertLiveFeed } from '@/components/alerts/alert-live-feed';
import { AlertFilters } from '@/components/alerts/alert-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';

export default function AlertsPage() {
  const t = useTranslations('alerts');
  const router = useRouter();
  const { token } = useAuth();
  const { alerts: liveAlerts, connected, ack, resolve } = useLiveAlerts(token || '');

  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  // Filter live alerts client-side
  const filtered = liveAlerts.filter((a) => {
    if (severity && a.severity !== severity) return false;
    if (type && a.type !== type) return false;
    if (status && a.status !== status) return false;
    return true;
  });

  async function handleAck(id: string) {
    ack(id);
    try {
      await apiClient.alerts.ack(id, token ?? undefined);
      toast('success', t('acknowledgeSuccess'));
    } catch {
      toast('error', 'Error acknowledging alert');
    }
  }

  async function handleResolve(id: string) {
    resolve(id);
    try {
      await apiClient.alerts.resolve(id, token ?? undefined);
      toast('success', t('resolveSuccess'));
    } catch {
      toast('error', 'Error resolving alert');
    }
  }

  function handleClear() {
    setSeverity('');
    setType('');
    setStatus('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <AlertFilters
        severity={severity}
        type={type}
        status={status}
        onSeverityChange={setSeverity}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onClear={handleClear}
      />

      <AlertLiveFeed
        alerts={filtered}
        connected={connected}
        onAck={handleAck}
        onResolve={handleResolve}
        onView={(a) => router.push(`/alerts/${a.id}`)}
      />
    </div>
  );
}
