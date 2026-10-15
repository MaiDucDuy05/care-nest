'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { subscriptionsService } from '@/services/subscriptions.service';
import type { PaymentRecord } from '@/services/subscriptions.service';
import { PlanCardSkeleton } from '@/components/ui/skeleton';

type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

const STATUS_ICON: Record<PaymentStatus, typeof CheckCircle2> = {
  PAID: CheckCircle2,
  PENDING: Clock,
  FAILED: Clock,
  REFUNDED: CreditCard,
};

const STATUS_COLOR: Record<PaymentStatus, string> = {
  PAID: 'var(--success)',
  PENDING: 'var(--warning)',
  FAILED: 'var(--danger)',
  REFUNDED: 'var(--text-muted)',
};

function normalizeStatus(s: string): PaymentStatus {
  const u = s.toUpperCase();
  return (u === 'PAID' || u === 'PENDING' || u === 'FAILED' || u === 'REFUNDED') ? u : 'PENDING';
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}export default function PaymentsPage() {
  const t = useTranslations('subscription');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await subscriptionsService.listPayments();
        if (!cancelled) setPayments(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('paymentHistory')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {t('paymentHistoryDesc', { count: payments.length })}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)' }}>
          <p>{t('errorLoadingPayments')}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>{t('noPayments')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {payments.map((p) => {
            const status = normalizeStatus(p.status);
            const Icon = STATUS_ICON[status];
            const color = STATUS_COLOR[status];
            return (
              <div
                key={p.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--bg-card-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {p.invoiceUrl ? (
                      <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                        {t('invoice')} #{p.id.slice(0, 8)}
                      </a>
                    ) : (
                      <>{t('invoice')} #{p.id.slice(0, 8)}</>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={12} />
                    {formatDate(p.paidAt)}
                    {p.method ? ` · ${p.method}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatVnd(p.amountVnd)}
                  </div>
                  <div style={{ fontSize: '12px', color, fontWeight: 600, marginTop: '2px' }}>
                    {t(`paymentStatus.${status}`)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
