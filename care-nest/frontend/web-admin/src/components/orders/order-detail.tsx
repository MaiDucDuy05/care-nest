'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiClient, type OrderDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface OrderDetailProps {
  data: OrderDetailResponse;
  onRefresh: () => void;
}

export function OrderDetail({ data, onRefresh }: OrderDetailProps) {
  const t = useTranslations('orders');
  const { token } = useAuth();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRefund() {
    if (!refundReason.trim()) return;
    setLoading(true);
    try {
      await apiClient.orders.refund(data.id, refundReason, token ?? undefined);
      toast('success', t('refundSuccess'));
      setRefundOpen(false);
      setRefundReason('');
      onRefresh();
    } catch {
      toast('error', 'Error processing refund');
    } finally {
      setLoading(false);
    }
  }

  const buyerName = data.buyerName || (data as any).buyer?.fullName || (data.shippingAddress as any)?.name || t('buyer');
  const sellerName = data.sellerName || (data as any).seller?.storeName || t('seller');
  const paymentMethod = data.paymentMethod || (data as any).payment?.method || 'COD';
  const totalAmount = data.totalVnd ?? Number((data as any).total ?? 0);
  const orderId = (data as any).orderNumber || data.id;

  const shippingAddr = data.shippingAddress;
  const recipientName = shippingAddr?.fullName || (shippingAddr as any)?.name || buyerName;
  const recipientPhone = shippingAddr?.phone || (data as any).buyer?.phone;
  const addressParts = [
    shippingAddr?.addressLine || (shippingAddr as any)?.line1,
    shippingAddr?.ward,
    shippingAddr?.district,
    shippingAddr?.province,
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header info */}
      <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '14px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('orderId')}:</span>{' '}
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{orderId}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('buyer')}:</span>{' '}
            <span style={{ fontWeight: 600 }}>{buyerName}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('seller')}:</span>{' '}
            <span>{sellerName}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('status')}:</span>{' '}
            <Badge variant="info">{t(`statuses.${data.status}`)}</Badge>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('totalAmount')}:</span>{' '}
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('paymentMethod')}:</span>{' '}
            <span>{paymentMethod}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('createdAt')}:</span>{' '}
            <span>{formatDateTime(data.createdAt)}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{t('updatedAt')}:</span>{' '}
            <span>{formatDateTime(data.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('items')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(data.items || []).map((item, i) => {
            const itemName = item.name || (item as any).productName || (item as any).product?.name || t('items');
            const unitPrice = item.unitPriceVnd ?? Number((item as any).unitPrice ?? 0);
            const quantity = item.quantity || 1;
            const lineTotal = quantity * unitPrice;
            const prodId = item.productId || (item as any).id || '';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{itemName}</div>
                  {prodId && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {prodId.slice(0, 8)}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>
                    {quantity} × {formatCurrency(unitPrice)}
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(lineTotal)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping address */}
      {shippingAddr && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('shippingAddress')}</h3>
          <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}>
            <div style={{ fontWeight: 600 }}>{recipientName}</div>
            {recipientPhone && <div>{recipientPhone}</div>}
            {addressParts.length > 0 && (
              <div style={{ color: 'var(--text-muted)' }}>
                {addressParts.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {data.timeline?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('timeline')}</h3>
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            {data.timeline.map((event, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: '16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--primary)' : 'var(--border-color)',
                    border: '2px solid var(--bg-card)',
                  }}
                />
                <div style={{ fontSize: '13px', fontWeight: i === 0 ? 700 : 500 }}>
                  {t(`statuses.${event.status}`)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatDateTime(event.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund action */}
      {!['REFUNDED', 'CANCELLED', 'RETURNED'].includes(data.status) && (
        <div style={{ display: 'flex' }}>
          <Button variant="danger" onClick={() => setRefundOpen(true)}>
            💰 {t('refund')}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={handleRefund}
        title={t('refund')}
        description={t('refundConfirm')}
        confirmText={t('refund')}
        variant="danger"
        requireReason
        reasonPlaceholder={t('refundReasonPlaceholder')}
        loading={loading}
      />
    </div>
  );
}
