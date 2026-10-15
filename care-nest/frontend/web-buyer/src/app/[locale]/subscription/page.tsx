'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CreditCard, ArrowUpRight, Clock, CheckCircle } from 'lucide-react';
import { subscriptionsService } from '@/services/subscriptions.service';
import { PlanCardSkeleton } from '@/components/ui/skeleton';
import type { Subscription } from '@carenest/shared-types';
import type { PaymentRecord } from '@/services/subscriptions.service';

export default function SubscriptionPage() {
  const t = useTranslations('subscription');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sub, pymts] = await Promise.all([
          subscriptionsService.getMySubscription(),
          subscriptionsService.listPayments(),
        ]);
        setSubscription(sub);
        setPayments(pymts);
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <PlanCardSkeleton />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '700px' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>{t('title')}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('subtitle')}</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Bạn chưa đăng ký gói dịch vụ nào. Nâng cấp ngay để kích hoạt theo dõi sức khỏe thời gian thực.
          </p>
          <Link href="/subscription/upgrade" className="btn btn-primary" style={{ padding: '14px 28px' }}>
            <ArrowUpRight size={16} /> Nâng cấp gói dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('subtitle')}</p>
      </div>

      {/* Current Plan Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '32px', border: '2px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CreditCard size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('currentPlan')}</h2>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
              {subscription.planId}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span className={`badge ${
                subscription.status === 'ACTIVE' ? 'badge-green' :
                subscription.status === 'PAUSED' ? 'badge-indigo' : 'badge-red'
              }`}>
                {t(`status.${subscription.status}`)}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {t('interval')}: {subscription.interval}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/subscription/upgrade" className="btn btn-primary">
              <ArrowUpRight size={16} /> {t('upgradeBtn')}
            </Link>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('currentPeriod')}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {new Date(subscription.currentPeriodStart).toLocaleDateString('vi-VN')} —{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('nextBilling')}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
          {t('paymentHistory')}
        </h2>
        {payments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            {t('noPayments')}
          </div>
        ) : (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('paymentDate')}
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('amount')}
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('method')}
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t('status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px' }}>
                      {new Date(p.paidAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amountVnd)}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px' }}>{p.method}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${p.status === 'PAID' ? 'badge-green' : 'badge-red'}`}>
                        {p.status === 'PAID' && <CheckCircle size={12} />}
                        {t(p.status.toLowerCase() as 'paid' | 'pending' | 'failed' | 'refunded')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
