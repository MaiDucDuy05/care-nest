'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

interface SettingsValues {
  storeName: string;
  storeSlug: string;
  description: string;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SettingsValues>({
    defaultValues: {
      storeName: 'Cửa hàng Demo',
      storeSlug: 'demo-store',
      description: '',
    },
  });

  const onSubmit = async (_data: SettingsValues) => {
    // Backend hookup TBD; for now just show a success state
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 className="text-h2">{t('title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 className="text-h3">{t('profile')}</h2>
        <div>
          <label className="label">{t('storeName')}</label>
          <input className="input" {...register('storeName')} />
        </div>
        <div>
          <label className="label">{t('storeSlug')}</label>
          <input className="input" {...register('storeSlug')} />
        </div>
        <div>
          <label className="label">{t('description')}</label>
          <textarea className="textarea" {...register('description')} />
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

      <p className="text-muted text-sm">
        {tCommon('loading')}
      </p>
    </div>
  );
}
