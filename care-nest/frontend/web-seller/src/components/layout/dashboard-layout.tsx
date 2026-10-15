'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { KycBanner } from '@/components/kyc/kyc-banner';
import { authService } from '@/lib/services/auth.service';
import { kycService } from '@/lib/services/kyc.service';
import type { KYCStatus, SellerProfile } from '@/lib/types';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations('common');
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>('NOT_STARTED');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await authService.me();
        const kyc = await kycService.getStatus();
        if (!mounted) return;
        setSeller(me);
        setKycStatus(me.kycStatus ?? kyc?.status ?? 'NOT_STARTED');
      } catch {
        router.replace('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner" />
        <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>{t('loading')}</span>
      </div>
    );
  }

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar kycApproved={kycStatus === 'APPROVED'} onLogout={handleLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar seller={seller} />
        <KycBanner kycStatus={kycStatus} />
        <main style={{ flex: 1, padding: '0 24px 24px' }}>{children}</main>
      </div>
    </div>
  );
}
