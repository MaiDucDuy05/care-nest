'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type OrderAdmin } from '@/lib/api-client';
import { OrderTable } from '@/components/orders/order-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebounce } from '@/lib/hooks/use-debounce';

const STATUSES = [
  '',
  'CREATED',
  'CONFIRMED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'PENDING',
  'REFUNDED',
];

export default function OrdersPage() {
  const t = useTranslations('orders');
  const router = useRouter();
  const [data, setData] = useState<OrderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.orders.list({ page: p, limit: 50, search: debouncedSearch, status: status || undefined });
      setData(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '260px' }}
        />
        <Select
          label={t('status')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUSES.map((s) => ({ value: s, label: s ? t(`statuses.${s}`) : t('allStatuses') }))}
        />
      </div>

      <OrderTable
        data={data}
        loading={loading}
        onView={(item) => router.push(`/orders/${item.id}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
