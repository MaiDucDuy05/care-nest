'use client';

import { useTranslations } from 'next-intl';

export default function ForbiddenPage() {
  const t = useTranslations('auth');

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '64px' }}>🚫</div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>{t('forbidden')}</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px' }}>{t('forbiddenDesc')}</p>
      <a href="/" style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '14px' }}>
        ← Back to Dashboard
      </a>
    </div>
  );
}
