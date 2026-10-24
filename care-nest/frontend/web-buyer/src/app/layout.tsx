import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareNest — TMĐT Y Tế & Giám Sát Sức Khỏe IoT Người Cao Tuổi',
  description: 'Nền tảng mua sắm thiết bị y tế chính hãng kết hợp hệ thống IoT giám sát sinh tồn và cảnh báo khẩn cấp cho gia đình.',
};

export default async function RootLayout({
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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
