'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/use-auth';
import { canManageAdmins } from '@/lib/role-guard';
import { Badge } from '@/components/ui/badge';

export default function AdminsPage() {
  const t = useTranslations('settings');
  const { user } = useAuth();

  if (!user || !canManageAdmins(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        You do not have permission to manage admins.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('admins')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('adminsDesc')}</p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Admin management features will be available in a future update.
        </p>
      </div>
    </div>
  );
}
