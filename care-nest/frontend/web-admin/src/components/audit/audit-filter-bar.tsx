'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { AuditFilters } from '@/lib/hooks/use-audit-filter';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'];
const ENTITY_TYPES = ['User', 'KycDocument', 'Product', 'Order', 'Subscription', 'Shipment', 'Alert', 'NotificationPreference'];

interface AuditFilterBarProps {
  filters: AuditFilters;
  onChange: (next: Partial<AuditFilters>) => void;
  onClear: () => void;
  onExportCsv?: () => void;
  canExport: boolean;
}

export function AuditFilterBar({ filters, onChange, onClear, onExportCsv, canExport }: AuditFilterBarProps) {
  const t = useTranslations('audit');
  const tCommon = useTranslations('common');

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <Input
        label={t('filterByActor')}
        placeholder={t('actorPlaceholder')}
        value={filters.actor || ''}
        onChange={(e) => onChange({ actor: e.target.value })}
        style={{ minWidth: '180px' }}
      />
      <Select
        label={t('filterByAction')}
        value={filters.action || ''}
        onChange={(e) => onChange({ action: e.target.value })}
        options={[
          { value: '', label: t('allActions') },
          ...ACTIONS.map((a) => ({ value: a, label: t(`actions.${a}`) })),
        ]}
      />
      <Select
        label={t('filterByEntityType')}
        value={filters.entityType || ''}
        onChange={(e) => onChange({ entityType: e.target.value })}
        options={[
          { value: '', label: t('allEntityTypes') },
          ...ENTITY_TYPES.map((e) => ({ value: e, label: t(`entityTypes.${e}`) || e })),
        ]}
      />
      <Input
        label={t('filterByDate')}
        type="date"
        value={filters.from || ''}
        onChange={(e) => onChange({ from: e.target.value })}
      />
      <Input
        label={tCommon('to')}
        type="date"
        value={filters.to || ''}
        onChange={(e) => onChange({ to: e.target.value })}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        {(filters.actor || filters.action || filters.entityType || filters.from || filters.to) && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            ✕ {tCommon('clearFilters')}
          </Button>
        )}
        {canExport && onExportCsv && (
          <Button variant="secondary" size="sm" onClick={onExportCsv}>
            📥 {t('exportCsv')}
          </Button>
        )}
      </div>
    </div>
  );
}
