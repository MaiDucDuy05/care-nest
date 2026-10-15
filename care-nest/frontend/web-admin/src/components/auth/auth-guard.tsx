'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  if (!isLoading && user && user.role !== 'ADMIN' && user.role !== 'SUPPORT' && user.role !== 'MEDICAL_REVIEWER') {
    router.push('/forbidden');
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
