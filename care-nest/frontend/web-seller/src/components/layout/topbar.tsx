'use client';

import { useTranslations } from 'next-intl';
import { Bell, Search } from 'lucide-react';
import type { SellerProfile } from '@/lib/types';

interface TopbarProps {
  seller: SellerProfile | null;
}

export function Topbar({ seller }: TopbarProps) {
  const t = useTranslations('common');
  return (
    <header
      style={{
        height: 64,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card-subtle)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          width: 320,
        }}
      >
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder={t('search')}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            flex: 1,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          aria-label="notifications"
          style={{ background: 'transparent', padding: 8, borderRadius: 8 }}
        >
          <Bell size={20} color="var(--text-muted)" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {(seller?.fullName ?? 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{seller?.fullName ?? 'Seller'}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seller?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
