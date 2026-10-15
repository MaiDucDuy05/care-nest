'use client';

import { useTranslations } from 'next-intl';

export type VitalType = 'heartRate' | 'bloodPressure' | 'spo2' | 'temperature';

interface VitalCardProps {
  type: VitalType;
  value: number | null;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical' | null;
  safeRange: string;
}

const VITAL_COLORS: Record<VitalType, string> = {
  heartRate: 'var(--danger)',
  bloodPressure: 'var(--primary)',
  spo2: 'var(--secondary)',
  temperature: 'var(--accent)',
};

const VITAL_ICONS: Record<VitalType, string> = {
  heartRate: '♥',
  bloodPressure: '↕',
  spo2: '◎',
  temperature: '°',
};

export function VitalCard({ type, value, unit, status, safeRange }: VitalCardProps) {
  const t = useTranslations('health.vitals');

  const color = VITAL_COLORS[type];
  const label = t(type);
  const statusLabel = status ? t(status) : null;
  const isLoading = value === null;

  const statusBadgeClass =
    status === 'normal'
      ? 'badge-green'
      : status === 'low' || status === 'high'
      ? 'badge-indigo'
      : status === 'critical'
      ? 'badge-red'
      : 'badge-teal';

  return (
    <div className="vitals-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '15px' }}>
          <span style={{ fontSize: '20px' }}>{VITAL_ICONS[type]}</span>
          {label}
        </span>
        {statusLabel && <span className={`badge ${statusBadgeClass}`}>{statusLabel}</span>}
        {isLoading && <span className="badge badge-teal">{t('common:loading')}</span>}
      </div>

      <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0' }}>
        {isLoading ? (
          <div style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: '100px',
            height: '36px',
            borderRadius: '8px',
          }} />
        ) : (
          <>
            {type === 'bloodPressure' && value !== null
              ? `${value}`
              : value?.toFixed(type === 'temperature' ? 1 : 0)}
            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
              {unit}
            </span>
          </>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {safeRange ? `${t('safeRange')}: ${safeRange}` : ''}
      </div>
    </div>
  );
}
