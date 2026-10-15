'use client';

import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { subscriptionsService } from '@/services/subscriptions.service';
import { formatVnd } from '@/lib/proration';

interface ProrationPreviewProps {
  fromPlanId: string;
  toPlanId: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ProrationPreview({ fromPlanId, toPlanId, onConfirm, isLoading }: ProrationPreviewProps) {
  const t = useTranslations('subscription.upgrade');
  const [preview, setPreview] = useState<{
    creditVnd: number;
    chargeVnd: number;
    netVnd: number;
    mode: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromPlanId || !toPlanId || fromPlanId === toPlanId) {
      setPreview(null);
      return;
    }

    const load = async () => {
      setIsLoadingPreview(true);
      setError(null);
      try {
        const result = await subscriptionsService.previewProration(fromPlanId, toPlanId);
        setPreview(result);
      } catch {
        setError('Không thể tải xem trước thanh toán');
      } finally {
        setIsLoadingPreview(false);
      }
    };

    load();
  }, [fromPlanId, toPlanId]);

  if (!fromPlanId || !toPlanId || fromPlanId === toPlanId) return null;

  return (
    <div className="card" style={{ padding: '20px', background: 'var(--bg-card-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Calculator size={18} color="var(--secondary)" />
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('prorationPreview')}</h3>
      </div>

      {isLoadingPreview && (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('loading')}</p>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>
      )}

      {preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('creditFrom')}</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
              -{formatVnd(preview.creditVnd)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('chargeFor')}</span>
            <span style={{ fontWeight: 600 }}>
              +{formatVnd(preview.chargeVnd)}
            </span>
          </div>
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: '16px',
          }}>
            <span>{t('netCharge')}</span>
            <span style={{ color: preview.netVnd > 0 ? 'var(--primary)' : 'var(--success)' }}>
              {preview.netVnd > 0 ? formatVnd(preview.netVnd) : formatVnd(0)}
            </span>
          </div>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isLoading ? t('switching') : t('confirmSwitch')}
          </button>
        </div>
      )}
    </div>
  );
}
