'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type AuditEventAdmin } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer';
import { Button } from '@/components/ui/button';

export default function AuditEntityPage() {
  const t = useTranslations('audit');
  const params = useParams();
  const router = useRouter();
  const entityType = params.entityType as string;
  const entityId = params.entityId as string;
  const { token } = useAuth();
  const [events, setEvents] = useState<AuditEventAdmin[]>([]);
  const [selected, setSelected] = useState<AuditEventAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.audit.getByEntity(entityType, entityId, token ?? undefined)
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{t('title')}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {t(`entityTypes.${entityType}`) || entityType} · {entityId.slice(0, 12)}...
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>{t('noEvents')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelected(e)}
              style={{
                padding: '12px 16px', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(ev) => (ev.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'}
              onMouseLeave={(ev) => (ev.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'}
            >
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{t(`actions.${e.action}`)} by {e.actorEmail}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.createdAt}</div>
            </div>
          ))}
        </div>
      )}

      <AuditDiffViewer event={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
