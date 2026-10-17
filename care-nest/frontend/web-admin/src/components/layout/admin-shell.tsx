'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from './top-nav';
import { Toaster } from '@/components/ui/toast';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const isAuthPage = pathname.includes('/auth/');

  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <main style={{ flex: 1, padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <Toaster />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
