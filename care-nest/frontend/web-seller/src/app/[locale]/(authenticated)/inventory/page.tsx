'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { imeiService } from '@/lib/services/imei.service';
import type { IMEIRecord, IMEIStatus } from '@/lib/types';

const STATUS_FILTERS: Array<{ value: IMEIStatus | ''; key: string }> = [
  { value: '', key: 'all' },
  { value: 'IN_STOCK', key: 'inStock' },
  { value: 'RESERVED', key: 'reserved' },
  { value: 'SHIPPED', key: 'shipped' },
  { value: 'ACTIVATED', key: 'activated' },
  { value: 'RETURNED', key: 'returned' },
  { value: 'FAULTY', key: 'faulty' },
];

const STATUS_BADGE: Record<IMEIStatus, string> = {
  IN_STOCK: 'badge-green',
  RESERVED: 'badge-amber',
  SHIPPED: 'badge-blue',
  ACTIVATED: 'badge-slate',
  RETURNED: 'badge-slate',
  FAULTY: 'badge-red',
};

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<IMEIRecord[]>([]);
  const [filter, setFilter] = useState<IMEIStatus | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await imeiService.list({ status: filter || undefined });
        if (mounted) setItems(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 className="text-h2">{t('title')}</h1>

      <div className="card" style={{ display: 'flex', gap: 12 }}>
        <select
          className="select"
          style={{ width: 200 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as IMEIStatus | '')}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value || 'all'} value={f.value}>
              {t(f.key as 'all' | 'inStock' | 'reserved' | 'shipped' | 'activated' | 'returned' | 'faulty')}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--text-muted)' }}>
            <div className="spinner" /> {tCommon('loading')}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('imei')}</th>
                <th>{t('product')}</th>
                <th>{t('status')}</th>
                <th>{t('assignedTo')}</th>
                <th>{t('createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'monospace' }}>{i.imei}</td>
                  <td>{i.productName ?? i.productId}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                  </td>
                  <td className="text-sm text-muted">{i.orderId ?? '—'}</td>
                  <td className="text-sm text-muted">{new Date(i.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
