'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { kycService } from '@/lib/services/kyc.service';
import { authService } from '@/lib/services/auth.service';

interface SettingsValues {
  storeName: string;
  storeSlug: string;
  description: string;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SettingsValues>({
    defaultValues: {
      storeName: '',
      storeSlug: '',
      description: '',
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await authService.me().catch(() => null);
        if (mounted && me) {
          reset({
            storeName: me.storeName || '',
            storeSlug: me.storeSlug || '',
            description: me.description || '',
          });
        }
      } catch {
        // silent
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reset]);

  const onSubmit = async (data: SettingsValues) => {
    setErrorMessage(null);
    try {
      await kycService.updateStoreProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Không thể cập nhật thông tin cửa hàng.');
    }
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="text-h2">{t('title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="text-h3">{t('profile')}</h2>

        {errorMessage && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: 13 }}>
            {errorMessage}
          </div>
        )}

        <div>
          <label className="label">{t('storeName')}</label>
          <input className="input" {...register('storeName', { required: true })} />
        </div>
        <div>
          <label className="label">{t('storeSlug')}</label>
          <input className="input" {...register('storeSlug', { required: true })} />
        </div>
        <div>
          <label className="label">{t('description')}</label>
          <textarea className="textarea" {...register('description')} rows={3} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {saved && (
            <span className="text-sm" style={{ color: 'var(--success)' }}>
              ✓ {t('saved')}
            </span>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
