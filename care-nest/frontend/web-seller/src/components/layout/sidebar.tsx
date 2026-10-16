'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  FileCheck2,
  Package,
  ShoppingCart,
  ScanLine,
  Boxes,
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  kycApproved: boolean;
  onLogout: () => void;
}

export function Sidebar({ kycApproved, onLogout }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items = [
    { href: '/dashboard' as const, label: t('dashboard'), icon: LayoutDashboard, enabled: true },
    { href: '/kyc' as const, label: t('kyc'), icon: FileCheck2, enabled: !kycApproved },
    { href: '/products' as const, label: t('products'), icon: Package, enabled: kycApproved },
    { href: '/orders' as const, label: t('orders'), icon: ShoppingCart, enabled: kycApproved },
    { href: '/imei' as const, label: t('imei'), icon: ScanLine, enabled: kycApproved },
    { href: '/inventory' as const, label: t('inventory'), icon: Boxes, enabled: kycApproved },
    { href: '/payouts' as const, label: t('payouts'), icon: Wallet, enabled: kycApproved },
    { href: '/analytics' as const, label: t('analytics'), icon: TrendingUp, enabled: kycApproved },
    { href: '/settings' as const, label: t('settings'), icon: Settings, enabled: true },
  ];

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '0 12px 24px', borderBottom: '1px solid var(--border-color)', marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>CareNest</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Seller Portal</div>
      </div>

      {items
        .filter((i) => i.enabled)
        .map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                background: active ? 'var(--primary-light)' : 'transparent',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                transition: 'var(--transition-smooth)',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

      <button
        type="button"
        onClick={onLogout}
        className="btn btn-ghost"
        style={{ marginTop: 'auto', justifyContent: 'flex-start' }}
      >
        <LogOut size={18} />
        <span>{t('logout')}</span>
      </button>
    </aside>
  );
}
