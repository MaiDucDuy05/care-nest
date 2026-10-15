'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type ProductAdmin } from '@/lib/api-client';
import { ProductQueueTable } from '@/components/products/product-queue-table';

export default function ProductsPage() {
  const t = useTranslations('products');
  const router = useRouter();
  const [data, setData] = useState<ProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const res = await apiClient.products.listPending({ page: p, limit: 50 });
      setData(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <ProductQueueTable
        data={data}
        loading={loading}
        onView={(item) => router.push(`/products/${item.id}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
