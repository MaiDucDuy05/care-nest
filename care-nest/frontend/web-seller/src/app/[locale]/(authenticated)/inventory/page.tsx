'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { inventoryService } from '@/lib/services/inventory.service';
import type { IMEIRecord, IMEIStatus } from '@/lib/types';

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
        const data = await inventoryService.list({ status: filter || undefined });
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
          <option value="">Tất cả</option>
          <option value="IN_STOCK">{t('inStock')}</option>
          <option value="RESERVED">{t('reserved')}</option>
          <option value="SOLD">{t('sold')}</option>
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
                    <span
                      className={`badge ${i.status === 'IN_STOCK' ? 'badge-green' : i.status === 'RESERVED' ? 'badge-amber' : 'badge-slate'}`}
                    >
                      {i.status === 'IN_STOCK' ? t('inStock') : i.status === 'RESERVED' ? t('reserved') : t('sold')}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{i.assignedOrderId ?? '—'}</td>
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
