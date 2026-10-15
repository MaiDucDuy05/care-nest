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
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const t = useTranslations('auth');
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
      await authService.register(data);
      router.replace('/kyc');
    } catch (err) {
      setSubmitError((err as Error).message || t('registerFailed'));
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
      <div className="card" style={{ maxWidth: 460, width: '100%' }}>
        <h1 className="text-h2" style={{ marginBottom: 24 }}>
          {t('registerTitle')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">{t('fullName')}</label>
            <input className="input" {...register('fullName')} />
            {errors.fullName && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="label">{t('email')}</label>
            <input className="input" type="email" {...register('email')} />
            {errors.email && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label">{t('phone')}</label>
            <input className="input" {...register('phone')} />
            {errors.phone && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors.phone.message}</p>
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
            {isSubmitting ? <span className="spinner" /> : t('submitRegister')}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {t('hasAccount')}{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {t('loginHere')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
