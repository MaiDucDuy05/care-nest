import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <AuthGuard>
          <AdminShell>{children}</AdminShell>
        </AuthGuard>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
