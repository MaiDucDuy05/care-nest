'use client';

import { Menu } from 'lucide-react';
import { LocaleSwitcher } from './locale-switcher';
import { UserMenu } from './user-menu';

interface TopbarProps {
  onToggleMobile: () => void;
}

export function Topbar({ onToggleMobile }: TopbarProps) {
  return (
    <header
      style={{
        height: '64px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onToggleMobile}
          className="admin-mobile-toggle"
          aria-label="Toggle navigation"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-main)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LocaleSwitcher />
        <UserMenu />
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .admin-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}

