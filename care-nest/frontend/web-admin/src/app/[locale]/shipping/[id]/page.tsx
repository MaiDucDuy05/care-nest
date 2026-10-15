'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type ShipmentDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatCurrency } from '@/lib/format';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  DELIVERED: 'success', PENDING: 'warning', IN_TRANSIT: 'info', OUT_FOR_DELIVERY: 'info',
  PICKED_UP: 'info', CANCELLED: 'danger', RETURNED: 'danger', FAILED: 'danger', RETURN_REQUESTED: 'warning',
};

export default function ShipmentDetailPage() {
  const t = useTranslations('shipping');
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<ShipmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.shipping.getById(shipmentId, token ?? undefined)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shipmentId]);

  if (loading) return <div><Skeleton width="200px" height="32px" /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Shipment not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{data.id.slice(0, 8)}...</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Order:</span> <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{data.orderId.slice(0, 8)}...</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('carrier')}:</span> <Badge variant="secondary">{t(`providers.${data.carrierCode}`)}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('status')}:</span> <Badge variant={statusVariant[data.status] || 'default'}>{t(`statuses.${data.status}`)}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('trackingNumber')}:</span> <span style={{ fontFamily: 'monospace' }}>{data.trackingNumber || '—'}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('shippingFee')}:</span> <span>{formatCurrency(data.shippingFeeVnd)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('estimatedDelivery')}:</span> {data.estimatedDeliveryAt ? formatDateTime(data.estimatedDeliveryAt) : '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('deliveredAt')}:</span> {data.deliveredAt ? formatDateTime(data.deliveredAt) : '—'}</div>
        </div>
      </div>

      {/* Items */}
      {data.items.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('items')}</h3>
          {data.items.map((item, i) => (
            <div key={i} style={{ padding: '10px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '4px', fontSize: '14px' }}>
              {item.name} × {item.quantity}
            </div>
          ))}
        </div>
      )}

      {/* Address */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('shippingAddress')}</h3>
        <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}>
          <div style={{ fontWeight: 600 }}>{data.shippingAddress.fullName}</div>
          <div>{data.shippingAddress.phone}</div>
          <div style={{ color: 'var(--text-muted)' }}>
            {[data.shippingAddress.addressLine, data.shippingAddress.ward, data.shippingAddress.district, data.shippingAddress.province].filter(Boolean).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}
