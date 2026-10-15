'use client';

import { Bell } from 'lucide-react';
import { AlertSkeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kind: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading?: boolean;
}

function getSeverityColor(severity: Alert['severity']) {
  switch (severity) {
    case 'CRITICAL': return 'var(--danger)';
    case 'HIGH': return 'var(--accent)';
    case 'MEDIUM': return 'var(--secondary)';
    default: return 'var(--success)';
  }
}

function formatAlertTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function AlertsList({ alerts, isLoading }: AlertsListProps) {
  const t = useTranslations('health.alerts');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <AlertSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <EmptyState
        icon={<Bell size={32} />}
        title={t('noAlerts')}
        description="Không có cảnh báo nào trong 24 giờ qua"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: alert.acknowledged ? '#f8fafc' : '#fef9f9',
            border: `1px solid ${alert.acknowledged ? 'var(--border-color)' : '#fecaca'}`,
            display: 'flex',
            gap: '12px',
            opacity: alert.acknowledged ? 0.7 : 1,
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: getSeverityColor(alert.severity),
            flexShrink: 0,
            marginTop: '4px',
            animation: alert.acknowledged ? 'none' : 'pulseGlow 2s infinite',
          }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
              {alert.message}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatAlertTime(alert.timestamp)} — {t(`severity.${alert.severity}`)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
