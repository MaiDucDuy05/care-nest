'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { KycBanner } from '@/components/kyc/kyc-banner';
import { authService } from '@/lib/services/auth.service';
import { kycService } from '@/lib/services/kyc.service';
import type { KYCStatus, SellerProfile } from '@/lib/types';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>('NOT_STARTED');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await authService.me();
        let latestKycStatus: KYCStatus | null = null;
        try {
          latestKycStatus = await kycService.getStatus();
        } catch {
          // If the KYC service is temporarily unavailable, keep the seller
          // restricted unless the authenticated profile already says approved.
        }
        if (!mounted) return;
        setSeller(me);
        setKycStatus(latestKycStatus ?? me.kycStatus ?? 'NOT_STARTED');
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

  const kycApproved = kycStatus === 'APPROVED';
  const isKycExemptRoute = pathname?.startsWith('/kyc') || pathname?.startsWith('/settings');
  const isBlockedByKyc = !loading && !kycApproved && Boolean(pathname) && !isKycExemptRoute;

  useEffect(() => {
    if (isBlockedByKyc) router.replace('/kyc');
  }, [isBlockedByKyc, router]);

  if (loading || isBlockedByKyc) {
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
