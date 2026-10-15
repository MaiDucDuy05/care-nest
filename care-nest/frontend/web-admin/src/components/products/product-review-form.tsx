'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiClient, type ProductDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ProductReviewFormProps {
  data: ProductDetailResponse;
  onSuccess: () => void;
}

export function ProductReviewForm({ data, onSuccess }: ProductReviewFormProps) {
  const t = useTranslations('products');
  const { token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function handleApprove() {
    setLoading('approve');
    try {
      await apiClient.products.approve(data.id, token ?? undefined);
      toast('success', t('approveSuccess'));
      onSuccess();
    } catch {
      toast('error', 'Error approving product');
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading('reject');
    try {
      await apiClient.products.reject(data.id, rejectReason, token ?? undefined);
      toast('success', t('rejectSuccess'));
      setRejectOpen(false);
      setRejectReason('');
      onSuccess();
    } catch {
      toast('error', 'Error rejecting product');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Images */}
      {data.images?.length ? (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {data.images.map((img, i) => (
            <img key={i} src={img} alt="" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
          ))}
        </div>
      ) : null}

      {/* Info */}
      <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <span style={{ fontWeight: 500 }}>{data.id}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('category')}:</span> <Badge variant="secondary">{data.category}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('price')}:</span> <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(data.priceVnd)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('seller')}:</span> <span>{data.sellerName}</span></div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('description')}</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{data.description}</p>
        </div>
      )}

      {/* Specifications */}
      {data.specifications && Object.keys(data.specifications).length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('specifications')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(data.specifications).map(([k, v]) => (
              <div key={k} style={{ fontSize: '13px', padding: '8px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}:</span>{' '}
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="primary" onClick={handleApprove} loading={loading === 'approve'}>
          ✅ {t('approve')}
        </Button>
        <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={loading === 'approve'}>
          ❌ {t('reject')}
        </Button>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title={t('reject')}
        description={t('rejectConfirm')}
        confirmText={t('reject')}
        variant="danger"
        requireReason
        reasonPlaceholder={t('rejectionReasonPlaceholder')}
        loading={loading === 'reject'}
      />
    </div>
  );
}
