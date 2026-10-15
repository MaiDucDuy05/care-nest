'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import type { AuditEventAdmin } from '@/lib/api-client';

interface AuditDiffViewerProps {
  event: AuditEventAdmin | null;
  open: boolean;
  onClose: () => void;
}

export function AuditDiffViewer({ event, open, onClose }: AuditDiffViewerProps) {
  const t = useTranslations('audit');
  const tCommon = useTranslations('common');

  if (!event) return null;

  const before = event.payload?.['before'] as Record<string, unknown> | undefined;
  const after = event.payload?.['after'] as Record<string, unknown> | undefined;

  const allKeys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]);
  const fields = Array.from(allKeys).filter((k) => !['password', 'token', 'secret', 'apiKey'].some((s) => k.toLowerCase().includes(s)));

  return (
    <Modal open={open} onClose={onClose} title={t('diffViewer')} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Summary */}
        <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('eventId')}:</span> <span style={{ fontFamily: 'monospace' }}>{event.id.slice(0, 8)}...</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('actor')}:</span> {event.actorEmail}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('timestamp')}:</span> {formatDateTime(event.createdAt)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('action')}:</span> <Badge variant="info">{t(`actions.${event.action}`)}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('entityType')}:</span> <Badge variant="secondary">{t(`entityTypes.${event.entityType}`) || event.entityType}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('entityId')}:</span> <span style={{ fontFamily: 'monospace' }}>{event.entityId.slice(0, 12)}...</span></div>
        </div>

        {/* Diff table */}
        {fields.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border-color)' }}>Field</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border-color)', color: 'var(--danger)' }}>{t('before')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border-color)', color: 'var(--success)' }}>{t('after')}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const b = before?.[field];
                  const a = after?.[field];
                  const changed = JSON.stringify(b) !== JSON.stringify(a);
                  return (
                    <tr key={field} style={{ background: changed ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <td style={{ padding: '8px', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{field}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', borderBottom: '1px solid var(--border-color)', color: changed ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {b !== undefined ? JSON.stringify(b) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', borderBottom: '1px solid var(--border-color)', color: changed ? 'var(--success)' : 'var(--text-muted)' }}>
                        {a !== undefined ? JSON.stringify(a) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('noChanges')}</p>
        )}
      </div>
    </Modal>
  );
}
