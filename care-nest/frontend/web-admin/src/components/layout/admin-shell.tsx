'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Toaster } from '@/components/ui/toast';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const isAuthPage = pathname.includes('/auth/') || pathname.includes('/login');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Vertical Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main style={{ flex: 1, padding: '24px 32px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      <Toaster />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
