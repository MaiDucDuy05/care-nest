'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/format';
import type { FailoverEvent } from '@/lib/api-client';

interface FailoverEventsListProps {
  events: FailoverEvent[];
}

export function FailoverEventsList({ events }: FailoverEventsListProps) {
  const t = useTranslations('shipping');

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t('failoverTitle')}</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('failoverDesc')}</p>

      {events.length === 0 ? (
        <EmptyState title={t('noFailoverEvents')} icon="🔄" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((event) => (
            <div key={event.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
            }}>
              <span style={{ fontSize: '20px' }}>🔄</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Badge variant="danger">{t('fromProvider', { provider: event.fromProvider })}</Badge>
                  <span>→</span>
                  <Badge variant="success">{t('toProvider', { provider: event.toProvider })}</Badge>
                  {event.autoSwitched && <Badge variant="warning">{t('autoSwitch')}</Badge>}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 500 }}>{t('failoverReason')}:</span> {event.reason}
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                  {formatDateTime(event.createdAt)} · Shipment: {event.shipmentId.slice(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
