'use client';

import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';
import type { Geofence } from '@/lib/types';

interface GeofenceListProps {
  geofences: Geofence[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GeofenceList({ geofences, selectedId, onSelect, onEdit, onDelete }: GeofenceListProps) {
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
      {geofences.map((gf) => {
        const isSelected = gf.id === selectedId;

        return (
          <div
            key={gf.id}
            onClick={() => onSelect?.(gf.id)}
            className={`card transition-all cursor-pointer ${
              isSelected ? 'ring-2 ring-teal-500 shadow-md' : 'hover:border-teal-300 hover:shadow-xs'
            }`}
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: isSelected ? '#f0fdfa' : 'var(--bg-card)',
              borderColor: isSelected ? '#0d9488' : 'var(--border-color)',
              opacity: gf.isActive ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isSelected ? '#0d9488' : 'var(--primary-light)',
                  color: isSelected ? '#ffffff' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: isSelected ? '#0f766e' : 'inherit' }}>
                  {gf.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {gf.shape === 'CIRCLE' && gf.circle
                    ? `Hình tròn · Bán kính ${gf.circle.radiusM}m`
                    : (gf as any).radiusMeters
                    ? `Hình tròn · Bán kính ${(gf as any).radiusMeters}m`
                    : gf.shape === 'POLYGON' && gf.polygon
                    ? `Đa giác · ${gf.polygon.vertices.length} đỉnh`
                    : 'Vùng an toàn hình tròn'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {(gf.alertEvents || ['ENTER', 'EXIT']).map((ev) => (
                    <span key={ev} className="badge badge-teal" style={{ fontSize: '11px', padding: '2px 6px' }}>
                      {ev === 'ENTER' ? '☛ Vào' : ev === 'EXIT' ? '☚ Ra' : '⏱ Dwell'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              {!gf.isActive && (
                <span className="badge badge-red" style={{ fontSize: '11px' }}>Tắt</span>
              )}
              <button
                type="button"
                onClick={() => onEdit(gf.id)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
                title={t('edit')}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
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
        );
      })}
    </div>
  );
}
