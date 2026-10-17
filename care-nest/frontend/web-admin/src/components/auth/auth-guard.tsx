'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  // Skip guarding on auth pages
  if (pathname.includes('/auth/login') || pathname.includes('/auth/forbidden') || pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'vi';
    router.push(`/${locale}/auth/login`);
    return null;
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPPORT' && user.role !== 'MEDICAL_REVIEWER') {
    const locale = pathname.startsWith('/en') ? 'en' : 'vi';
    router.push(`/${locale}/auth/forbidden`);
    return null;
  }

  return <>{children}</>;
}
