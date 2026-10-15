'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import type { ProviderHealth } from '@/lib/api-client';

interface ProviderHealthCardProps {
  providers: ProviderHealth[];
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
};

const statusColor: Record<string, string> = {
  online: 'var(--success)',
  degraded: 'var(--accent)',
  offline: 'var(--danger)',
};

export function ProviderHealthCard({ providers }: ProviderHealthCardProps) {
  const t = useTranslations('shipping');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      {providers.map((p) => (
        <div key={p.code} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Status indicator bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: statusColor[p.status] }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>
                {t(`providers.${p.code}`)}
              </div>
              <Badge variant={statusVariant[p.status]} style={{ fontSize: '11px' }}>
                {t(`providerHealth.${p.status}`)}
              </Badge>
            </div>
            <div style={{ fontSize: '24px' }}>
              {p.code === 'GHN' || p.code === 'GHN_SLOW' ? '📦' : p.code === 'GHTK' || p.code === 'GHTK_SLOW' ? '📬' : '🚛'}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span>{t('providerHealth.lastHeartbeat')}:</span>{' '}
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{formatDateTime(p.lastHeartbeat)}</span>
            </div>
            <div>
              <span>Success rate:</span>{' '}
              <span style={{ fontWeight: 700, color: p.successRate >= 95 ? 'var(--success)' : p.successRate >= 80 ? 'var(--accent)' : 'var(--danger)' }}>
                {p.successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
