'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { HeartPulse, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.login(email.trim(), password);
      router.push('/health/dashboard');
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.message || 'Đăng nhập không thành công');
      } catch {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{
      maxWidth: '460px',
      paddingTop: '60px',
      paddingBottom: '80px',
    }}>
      <div className="card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: '#fff',
            marginBottom: '12px',
          }}>
            <HeartPulse size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {t('loginTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('loginSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light, #fee2e2)',
            color: 'var(--danger, #dc2626)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t('email')}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <Mail size={18} color="var(--text-muted)" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('password')}</label>
              <Link href="#" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{t('forgotPassword')}</Link>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <Lock size={18} color="var(--text-muted)" />
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ padding: '12px', width: '100%', marginTop: '5px' }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" /> Đang đăng nhập...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {t('loginBtn')} <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          {t('noAccount')}{' '}
          <Link href="/auth/register" id="login-goto-register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            {t('registerNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
