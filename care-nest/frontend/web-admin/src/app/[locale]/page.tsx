'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KpiGrid } from '@/components/kpi/kpi-grid';
import { KpiCard } from '@/components/kpi/kpi-card';
import { useAuth } from '@/lib/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
          {t('welcome', { name: user?.fullName?.split(' ')[0] || 'Admin' })}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('subtitle')}</p>
      </div>

      {/* KPI Grid */}
      <KpiGrid>
        <KpiCard
          title={t('pendingKyc')}
          value="—"
          description={t('pendingKycDesc')}
          icon="🪪"
          variant="primary"
        />
        <KpiCard
          title={t('pendingProducts')}
          value="—"
          description={t('pendingProductsDesc')}
          icon="📦"
          variant="warning"
        />
        <KpiCard
          title={t('todayOrders')}
          value="—"
          description={t('todayOrdersDesc')}
          icon="🧾"
          variant="default"
        />
        <KpiCard
          title={t('todayAlerts')}
          value="—"
          description={t('todayAlertsDesc')}
          icon="🚨"
          variant="danger"
        />
      </KpiGrid>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{t('quickActions')}</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: t('viewAllKyc'), href: '/kyc', icon: '🪪' },
            { label: t('viewAllProducts'), href: '/products', icon: '📦' },
            { label: t('viewAllOrders'), href: '/orders', icon: '🧾' },
            { label: t('viewAllAlerts'), href: '/alerts', icon: '🚨' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', fontWeight: 600, color: 'var(--text-main)',
                transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'; }}
            >
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{t('recentActivity')}</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
          No recent activity to display.
        </div>
      </div>
    </div>
  );
}
