'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AlertCircle, X } from 'lucide-react';

interface KycBannerProps {
  kycStatus: 'NOT_STARTED' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'MISSING_DOCS';
  dismissable?: boolean;
  onDismiss?: () => void;
}

export function KycBanner({ kycStatus, dismissable = true, onDismiss }: KycBannerProps) {
  const t = useTranslations('kyc.banner');
  const tStatus = useTranslations('kyc.status');

  if (kycStatus === 'APPROVED') return null;

  const colors: Record<Exclude<typeof kycStatus, 'APPROVED'>, { bg: string; fg: string; icon: string }> = {
    NOT_STARTED: { bg: 'var(--accent-light)', fg: 'var(--accent)', icon: 'var(--accent)' },
    DRAFT: { bg: 'var(--accent-light)', fg: 'var(--accent)', icon: 'var(--accent)' },
    MISSING_DOCS: { bg: 'var(--danger-light)', fg: 'var(--danger)', icon: 'var(--danger)' },
    IN_REVIEW: { bg: 'var(--secondary-light)', fg: 'var(--secondary)', icon: 'var(--secondary)' },
    REJECTED: { bg: 'var(--danger-light)', fg: 'var(--danger)', icon: 'var(--danger)' },
  };
  const c = colors[kycStatus];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: c.bg,
        color: c.fg,
        borderRadius: 'var(--radius-md)',
        margin: '0 24px 24px',
      }}
    >
      <AlertCircle size={20} color={c.icon} />
      <div style={{ flex: 1, fontSize: 14 }}>
        <strong>{t('title')}</strong>
        {kycStatus !== 'NOT_STARTED' && (
          <span style={{ marginLeft: 8, opacity: 0.8 }}>
            — {tStatus(kycStatus.toLowerCase() as 'notStarted' | 'inReview' | 'rejected' | 'missingDocs')}
          </span>
        )}
      </div>
      <Link href="/kyc" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
        {t('cta')}
      </Link>
      {dismissable && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="dismiss"
          style={{ background: 'transparent', padding: 4 }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
