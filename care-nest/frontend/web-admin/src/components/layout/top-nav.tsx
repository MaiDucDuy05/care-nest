'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { UserMenu } from './user-menu';
import { LocaleSwitcher } from './locale-switcher';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/', icon: '📊' },
  { key: 'kyc', href: '/kyc', icon: '🪪' },
  { key: 'products', href: '/products', icon: '📦' },
  { key: 'users', href: '/users', icon: '👥' },
  { key: 'orders', href: '/orders', icon: '🧾' },
  { key: 'alerts', href: '/alerts', icon: '🚨' },
  { key: 'audit', href: '/audit', icon: '📋' },
  { key: 'subscriptions', href: '/subscriptions', icon: '💳' },
  { key: 'shipping', href: '/shipping', icon: '🚚' },
];

export function TopNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        gap: '8px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px' }}>
          <span style={{ fontSize: '20px' }}>🏥</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>CareNest</span>
          <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Admin</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '4px', flex: 1, overflowX: 'auto' }} className="desktop-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href as '/'}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: isActive(item.href) ? 700 : 500,
                color: isActive(item.href) ? 'var(--primary)' : 'var(--text-muted)',
                background: isActive(item.href) ? 'var(--primary-light)' : 'transparent',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: '6px' }}>{item.icon}</span>
              {t(item.key as keyof typeof t)}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
}
