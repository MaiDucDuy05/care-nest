'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiClient, type KycDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDateTime } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface KycReviewFormProps {
  data: KycDetailResponse;
  onSuccess: () => void;
}

export function KycReviewForm({ data, onSuccess }: KycReviewFormProps) {
  const t = useTranslations('kyc');
  const { token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  async function handleApprove() {
    setLoading('approve');
    try {
      await apiClient.kyc.approve(data.seller.id, undefined, token ?? undefined);
      toast('success', t('approveSuccess'));
      onSuccess();
    } catch {
      toast('error', 'Error approving KYC');
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(reason?: string) {
    setLoading('reject');
    try {
      await apiClient.kyc.reject(data.seller.id, reason || 'Rejected by admin', token ?? undefined);
      toast('success', t('rejectSuccess'));
      setRejectOpen(false);
      onSuccess();
    } catch {
      toast('error', 'Error rejecting KYC');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Seller info */}
      <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t('seller')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <span style={{ fontWeight: 500 }}>{data.seller.id}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('seller')}:</span> <span style={{ fontWeight: 500 }}>{data.seller.fullName}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span>{data.seller.email}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <span>{data.seller.phone || '—'}</span></div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t('documents')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.documents.map((doc) => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{doc.filename || doc.type}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTime(doc.createdAt)}
                  </div>
                </div>
              </div>
              <Badge variant={doc.status === 'APPROVED' ? 'success' : doc.status === 'REJECTED' ? 'danger' : 'warning'}>
                {t(doc.status.toLowerCase() as 'pending' | 'approved' | 'rejected')}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Lock warning */}
      {data.lockedBy && (
        <div style={{ padding: '12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--accent)' }}>
          🔒 {t('reviewLocked')} — {t('reviewLockExpires', { minutes: 5 })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="primary" onClick={handleApprove} loading={loading === 'approve'} disabled={!!data.lockedBy}>
          ✅ {t('approve')}
        </Button>
        <Button variant="danger" onClick={() => setRejectOpen(true)} loading={loading === 'reject'} disabled={!!data.lockedBy}>
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
