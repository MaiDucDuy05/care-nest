'use client';

import { usePathname, useRouter as useNextRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useRouter as useIntlRouter } from '@/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useIntlRouter();
  const pathname = usePathname();
  const _nextRouter = useNextRouter();

  function toggle() {
    const next = locale === 'vi' ? 'en' : 'vi';
    // next-intl typed router uses a `locale` option on push/replace
    (router as unknown as { replace: (p: string, opts: { locale: string }) => void }).replace(pathname, { locale: next });
    void _nextRouter;
  }

  return (
    <button
      onClick={toggle}
      style={{
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card-subtle)',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textTransform: 'uppercase',
      }}
    >
      {locale === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
    </button>
  );
}
