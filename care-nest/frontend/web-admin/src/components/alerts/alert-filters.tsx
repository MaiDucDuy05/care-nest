'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';

interface AlertFiltersProps {
  severity: string;
  type: string;
  status: string;
  onSeverityChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClear: () => void;
}

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TYPES = ['SOS', 'FALL_DETECTED', 'GEOFENCE_EXIT', 'DEVICE_OFFLINE', 'LOW_BATTERY', 'HEART_RATE_ABNORMAL', 'SYSTEM'];
const STATUSES = ['PENDING', 'ACKNOWLEDGED', 'RESOLVED'];

export function AlertFilters({ severity, type, status, onSeverityChange, onTypeChange, onStatusChange, onClear }: AlertFiltersProps) {
  const t = useTranslations('alerts');

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <Select
        label={t('filterBySeverity')}
        value={severity}
        onChange={(e) => onSeverityChange(e.target.value)}
        options={[
          { value: '', label: t('allSeverities') },
          ...SEVERITIES.map((s) => ({ value: s, label: t(`severities.${s}`) })),
        ]}
      />
      <Select
        label={t('filterByType')}
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        options={[
          { value: '', label: t('allTypes') },
          ...TYPES.map((s) => ({ value: s, label: t(`types.${s}`) })),
        ]}
      />
      <Select
        label={t('filterByStatus')}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { value: '', label: t('allStatuses') },
          ...STATUSES.map((s) => ({ value: s, label: t(s.toLowerCase() === 'pending' ? 'pending' : s === 'ACKNOWLEDGED' ? 'acknowledged' : 'resolved') })),
        ]}
      />
      {(severity || type || status) && (
        <button
          onClick={onClear}
          style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ✕ {t('clearFilters')}
        </button>
      )}
    </div>
  );
}
