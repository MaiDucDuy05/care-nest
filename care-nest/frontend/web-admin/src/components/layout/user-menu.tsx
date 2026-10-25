'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const t = useTranslations('auth');
  const tRoles = useTranslations('users.roles');
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const displayName =
    typeof user.fullName === 'string' && user.fullName.trim()
      ? user.fullName.trim()
      : typeof user.email === 'string' && user.email.includes('@')
        ? user.email.slice(0, user.email.indexOf('@'))
        : 'User';
  const roleLabel =
    user.role === 'ADMIN'
      ? tRoles('ADMIN')
      : user.role === 'MEDICAL_REVIEWER'
        ? tRoles('MEDICAL_REVIEWER')
        : user.role;
  const roleVariant = user.role === 'ADMIN' ? 'danger' : user.role === 'MEDICAL_REVIEWER' ? 'info' : 'secondary';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 10px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700,
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <Badge variant={roleVariant} style={{ fontSize: '10px', padding: '0 4px' }}>
            {roleLabel}
          </Badge>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          minWidth: '200px', zIndex: 200,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{displayName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <div style={{ padding: '8px' }}>
            <button
              onClick={() => { logout(); setOpen(false); }}
              style={{
                width: '100%', padding: '8px 12px', textAlign: 'left',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, color: 'var(--danger)',
                background: 'none', border: 'none', fontFamily: 'inherit',
                transition: 'var(--transition-smooth)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {t('logoutBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
