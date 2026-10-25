'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('invalidCredentials');
      setError(message);
      toast('error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏥</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>CareNest</h1>
          <div style={{ display: 'inline-flex', background: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px' }}>Admin</div>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>{t('loginTitle')}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>{t('loginSubtitle')}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label={t('email')}
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('password')}
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div style={{ padding: '10px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            {loading ? t('loggingIn') : t('loginBtn')}
          </Button>
        </form>
      </div>
    </div>
  );
}
