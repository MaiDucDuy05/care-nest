'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type OrderDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { OrderDetail } from '@/components/orders/order-detail';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await apiClient.orders.getById(orderId, token ?? undefined);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [orderId]);

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><Skeleton width="200px" height="32px" /><Skeleton width="100%" height="300px" /></div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Order not found</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{t('orderId')}: {orderId.slice(0, 8)}...</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('pendingTitle')}</p>
        </div>
      </div>

      <OrderDetail data={data} onRefresh={fetchData} />
    </div>
  );
}
