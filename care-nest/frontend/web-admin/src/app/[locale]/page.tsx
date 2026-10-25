'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KpiGrid } from '@/components/kpi/kpi-grid';
import { KpiCard } from '@/components/kpi/kpi-card';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiClient, type AuditEventAdmin } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';

interface DashboardMetrics {
  pendingKyc: number | string;
  pendingProducts: number | string;
  todayOrders: number | string;
  todayAlerts: number | string;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tAudit = useTranslations('audit');
  const { user, token } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    pendingKyc: '—',
    pendingProducts: '—',
    todayOrders: '—',
    todayAlerts: '—',
  });
  const [activities, setActivities] = useState<AuditEventAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [kycRes, prodRes, ordRes, alertRes, auditRes] = await Promise.allSettled([
          apiClient.kyc.listPending({ page: 1, limit: 1 }),
          apiClient.products.listPending({ page: 1, limit: 1 }),
          apiClient.orders.list({ page: 1, limit: 1 }),
          apiClient.alerts.list({ page: 1, limit: 1 }),
          apiClient.audit.list({ page: 1, limit: 5 }),
        ]);

        if (!mounted) return;

        setMetrics({
          pendingKyc: kycRes.status === 'fulfilled' ? kycRes.value.total ?? 0 : 0,
          pendingProducts: prodRes.status === 'fulfilled' ? prodRes.value.total ?? 0 : 0,
          todayOrders: ordRes.status === 'fulfilled' ? ordRes.value.total ?? 0 : 0,
          todayAlerts: alertRes.status === 'fulfilled' ? alertRes.value.total ?? 0 : 0,
        });

        if (auditRes.status === 'fulfilled' && auditRes.value?.data?.length > 0) {
          setActivities(auditRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
          {t('welcome', { name: user?.fullName || 'Quản Trị Viên' })}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('subtitle')}</p>
      </div>

      {/* KPI Grid */}
      <KpiGrid>
        <KpiCard
          title={t('pendingKyc')}
          value={loading ? <Skeleton width="48px" height="32px" /> : metrics.pendingKyc}
          description={t('pendingKycDesc')}
          icon="🪪"
          variant="primary"
        />
        <KpiCard
          title={t('pendingProducts')}
          value={loading ? <Skeleton width="48px" height="32px" /> : metrics.pendingProducts}
          description={t('pendingProductsDesc')}
          icon="📦"
          variant="warning"
        />
        <KpiCard
          title={t('todayOrders')}
          value={loading ? <Skeleton width="48px" height="32px" /> : metrics.todayOrders}
          description={t('todayOrdersDesc')}
          icon="🧾"
          variant="default"
        />
        <KpiCard
          title={t('todayAlerts')}
          value={loading ? <Skeleton width="48px" height="32px" /> : metrics.todayAlerts}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-main)',
                transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-main)';
              }}
            >
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{t('recentActivity')}</h2>
        {loading ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <Skeleton width="100%" height="40px" style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height="40px" />
          </div>
        ) : activities.length > 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {activities.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: idx < activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                  fontSize: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge variant={item.action === 'CREATE' ? 'success' : item.action === 'DELETE' ? 'danger' : 'info'}>
                    {item.action}
                  </Badge>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.entityType} ({item.entityId ? item.entityId.slice(0, 8) : '—'})
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                      bởi {item.actorName || item.actorEmail || 'Hệ thống'}
                    </span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 20px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
              <span style={{ color: 'var(--success)' }}>●</span> Hệ thống CareNest Microservices đang hoạt động ổn định
            </div>
            <div style={{ fontSize: '13px' }}>
              Hiện có <strong>{metrics.pendingKyc}</strong> hồ sơ KYC đang chờ duyệt, <strong>{metrics.todayOrders}</strong> đơn hàng đã tạo, và <strong>{metrics.todayAlerts}</strong> cảnh báo sức khỏe IoT trên nền tảng.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
