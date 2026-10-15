'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelative } from '@/lib/format';
import type { AlertAdmin } from '@/lib/api-client';

interface AlertLiveFeedProps {
  alerts: AlertAdmin[];
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
  onView: (alert: AlertAdmin) => void;
  connected: boolean;
}

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

const typeIcons: Record<string, string> = {
  SOS: '🆘',
  FALL_DETECTED: '🪂',
  GEOFENCE_EXIT: '📍',
  DEVICE_OFFLINE: '📴',
  LOW_BATTERY: '🔋',
  HEART_RATE_ABNORMAL: '❤️',
  SYSTEM: '⚙️',
};

export function AlertLiveFeed({ alerts, onAck, onResolve, onView, connected }: AlertLiveFeedProps) {
  const t = useTranslations('alerts');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Connection status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        background: connected ? 'var(--success-light)' : 'var(--danger-light)',
        fontSize: '12px', fontWeight: 600,
        color: connected ? '#065f46' : '#991b1b',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--danger)', animation: connected ? 'pulse 2s infinite' : 'none' }} />
        {connected ? t('liveConnected') : t('liveDisconnected')}
        {connected && <span style={{ marginLeft: 'auto' }}>🔴 LIVE</span>}
      </div>

      {alerts.length === 0 ? (
        <EmptyState title={t('noAlerts')} description={t('noAlertsDesc')} icon="🚨" />
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => onView(alert)}
            style={{
              padding: '12px 16px',
              background: alert.status === 'RESOLVED' ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
              border: `1px solid ${alert.status === 'RESOLVED' ? 'var(--border-color)' : severityVariant[alert.severity] === 'danger' ? 'var(--danger)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              opacity: alert.status === 'RESOLVED' ? 0.7 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '20px', marginTop: '2px' }}>{typeIcons[alert.type] || '⚠️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <Badge variant={severityVariant[alert.severity] || 'default'}>
                    {t(`severities.${alert.severity}`)}
                  </Badge>
                  <Badge variant="secondary">{t(`types.${alert.type}`)}</Badge>
                  {alert.status === 'ACKNOWLEDGED' && <Badge variant="info">{t('acknowledged')}</Badge>}
                  {alert.status === 'RESOLVED' && <Badge variant="success">{t('resolved')}</Badge>}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', color: 'var(--text-main)' }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {alert.userName && <span>{alert.userName} · </span>}
                  {formatRelative(alert.createdAt)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
              {alert.status === 'PENDING' && (
                <Button size="sm" variant="outline" onClick={() => onAck(alert.id)}>
                  ✓ {t('acknowledge')}
                </Button>
              )}
              {alert.status !== 'RESOLVED' && (
                <Button size="sm" variant="primary" onClick={() => onResolve(alert.id)}>
                  ✅ {t('resolve')}
                </Button>
              )}
            </div>
          </div>
        ))
      )}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
