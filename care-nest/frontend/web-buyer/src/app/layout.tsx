import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'CareNest — TMĐT Y Tế & Giám Sát Sức Khỏe IoT Người Cao Tuổi',
  description: 'Nền tảng mua sắm thiết bị y tế chính hãng kết hợp hệ thống IoT giám sát sinh tồn và cảnh báo khẩn cấp cho gia đình.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
