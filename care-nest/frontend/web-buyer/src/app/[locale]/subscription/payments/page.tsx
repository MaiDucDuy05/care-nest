'use client';

import { useTranslations } from 'next-intl';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const t = useTranslations('subscription');

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('paymentHistory')}
        </h1>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>{t('noPayments')}</p>
      </div>
    </div>
  );
}
