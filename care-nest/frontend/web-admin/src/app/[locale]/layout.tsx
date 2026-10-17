import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AdminShell } from '@/components/layout/admin-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AuthProvider } from '@/lib/hooks/use-auth';

export const metadata: Metadata = {
  title: {
    template: '%s | CareNest Admin',
    default: 'CareNest Admin',
  },
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <AuthGuard>
              <AdminShell>{children}</AdminShell>
            </AuthGuard>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
