'use client';

import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';
import type { Geofence } from '@/lib/types';

interface GeofenceListProps {
  geofences: Geofence[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GeofenceList({ geofences, onEdit, onDelete }: GeofenceListProps) {
  const t = useTranslations('geofence');

  if (!geofences.length) {
    return (
      <EmptyState
        icon={<MapPin size={32} />}
        title={t('noGeofences')}
        description={t('noGeofences')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {geofences.map((gf) => (
        <div
          key={gf.id}
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            opacity: gf.isActive ? 1 : 0.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{gf.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {gf.shape === 'CIRCLE' && gf.circle
                  ? `Hình tròn · Bán kính ${gf.circle.radiusM}m`
                  : gf.shape === 'POLYGON' && gf.polygon
                  ? `Đa giác · ${gf.polygon.vertices.length} đỉnh`
                  : gf.shape}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {gf.alertEvents.map((ev) => (
                  <span key={ev} className="badge badge-teal" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    {ev === 'ENTER' ? '☛ Vào' : ev === 'EXIT' ? '☚ Ra' : '⏱ Dwell'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {!gf.isActive && (
              <span className="badge badge-red" style={{ fontSize: '11px' }}>Tắt</span>
            )}
            <button
              onClick={() => onEdit(gf.id)}
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              title={t('edit')}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm(t('deleteConfirm'))) onDelete(gf.id);
              }}
              className="btn btn-danger"
              style={{ padding: '6px 10px' }}
              title={t('delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
