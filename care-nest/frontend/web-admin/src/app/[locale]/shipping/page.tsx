'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type ShipmentAdmin, type ProviderHealth, type FailoverEvent } from '@/lib/api-client';
import { ShipmentTable } from '@/components/shipping/shipment-table';
import { ProviderHealthCard } from '@/components/shipping/provider-health-card';
import { FailoverEventsList } from '@/components/shipping/failover-events-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShippingPage() {
  const t = useTranslations('shipping');
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentAdmin[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [failoverEvents, setFailoverEvents] = useState<FailoverEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, f] = await Promise.all([
        apiClient.shipping.listShipments({ page: 1, limit: 50 }),
        apiClient.shipping.listProviders().catch(() => ({ providers: [] })),
        apiClient.shipping.listFailoverEvents({ limit: 50 }).catch(() => ({ events: [] })),
      ]);
      setShipments(s.data);
      setTotalPages(s.totalPages);
      setProviders(p.providers);
      setFailoverEvents(f.events);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      {/* Provider health */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[0,1,2].map((i) => <Skeleton key={i} width="100%" height="120px" />)}
        </div>
      ) : providers.length > 0 ? (
        <ProviderHealthCard providers={providers} />
      ) : null}

      {/* Failover events */}
      {failoverEvents.length > 0 && <FailoverEventsList events={failoverEvents} />}

      {/* Shipments table */}
      <ShipmentTable
        data={shipments}
        loading={loading}
        onView={(item) => router.push(`/shipping/${item.id}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={() => {}}
      />
    </div>
  );
}
