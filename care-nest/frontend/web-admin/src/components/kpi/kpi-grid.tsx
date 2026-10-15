'use client';

import type { ReactNode } from 'react';
import { KpiCard } from './kpi-card';

interface KpiGridProps {
  children: ReactNode;
}

export function KpiGrid({ children }: KpiGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
    }}>
      {children}
    </div>
  );
}
