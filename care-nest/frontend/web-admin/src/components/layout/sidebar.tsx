'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  Users,
  Receipt,
  BellRing,
  ClipboardList,
  CreditCard,
  Truck,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { key: 'dashboard', href: '/' as const, icon: LayoutDashboard },
  { key: 'kyc', href: '/kyc' as const, icon: ShieldCheck },
  { key: 'products', href: '/products' as const, icon: Package },
  { key: 'users', href: '/users' as const, icon: Users },
  { key: 'orders', href: '/orders' as const, icon: Receipt },
  { key: 'alerts', href: '/alerts' as const, icon: BellRing },
  { key: 'audit', href: '/audit' as const, icon: ClipboardList },
  { key: 'subscriptions', href: '/subscriptions' as const, icon: CreditCard },
  { key: 'shipping', href: '/shipping' as const, icon: Truck },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 140,
          }}
          className="admin-sidebar-backdrop"
        />
      )}

      <aside
        className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: 150,
          transition: 'transform 0.25s ease-in-out',
        }}
      >
        {/* Brand header */}
        <div
          style={{
            height: '64px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Link
            href="/"
            onClick={onCloseMobile}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              🏥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--primary)', letterSpacing: '-0.3px' }}>
                  CareNest
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Admin
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hệ thống quản trị</div>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="mobile-close-btn"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation items list */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--text-light)',
              padding: '4px 12px 8px',
            }}
          >
            Menu chính
          </div>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onCloseMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  background: active ? 'var(--primary-light)' : 'transparent',
                  position: 'relative',
                  transition: 'var(--transition-smooth)',
                }}
                className={active ? 'nav-item-active' : 'nav-item-inactive'}
              >
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '0px',
                      top: '8px',
                      bottom: '8px',
                      width: '4px',
                      background: 'var(--primary)',
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                )}
                <Icon
                  size={18}
                  style={{
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t(item.key as any)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
                boxShadow: '0 0 0 2px var(--success-light)',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Hệ thống ổn định
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: 'monospace' }}>
            v1.0
          </span>
        </div>

        <style>{`
          .nav-item-inactive:hover {
            background: var(--bg-card-subtle) !important;
            color: var(--text-main) !important;
          }
          @media (max-width: 1023px) {
            .admin-sidebar {
              position: fixed !important;
              left: 0;
              top: 0;
              bottom: 0;
              transform: translateX(-100%);
              box-shadow: var(--shadow-xl);
            }
            .admin-sidebar.mobile-open {
              transform: translateX(0) !important;
            }
            .mobile-close-btn {
              display: flex !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
}
