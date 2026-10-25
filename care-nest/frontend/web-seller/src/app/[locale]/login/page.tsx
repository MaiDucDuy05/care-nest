'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const tErr = useTranslations('common');
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitError(null);
      await authService.login(data.email, data.password);
      router.replace('/dashboard');
    } catch (err) {
      setSubmitError((err as Error).message || t('loginFailed'));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 className="text-h2" style={{ marginBottom: 8 }}>
          {t('loginTitle')}
        </h1>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          CareNest Seller
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">{t('email')}</label>
            <input className="input" type="email" {...register('email')} />
            {errors.email && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">{t('password')}</label>
            <input className="input" type="password" {...register('password')} />
            {errors.password && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>
            )}
          </div>

          {submitError && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              {submitError}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : t('submitLogin')}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {t('noAccount')}{' '}
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {t('registerHere')}
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-light)' }}>
            {tErr('error')} dev? Set <code>NEXT_PUBLIC_USE_MOCK_AUTH=true</code>; demo seller:{' '}
            <code>demo.seller@carenest.vn</code> / <code>Seller@123456</code>
          </p>
        </form>
      </div>
    </div>
  );
}
