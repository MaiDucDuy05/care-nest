'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const PieChart = dynamic(
  () => import('recharts').then((m) => m.PieChart as never),
  { ssr: false, loading: () => <div style={{ height: '200px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }} /> },
) as never;
const Pie = dynamic(() => import('recharts').then((m) => m.Pie as never), { ssr: false }) as never;
const Cell = dynamic(() => import('recharts').then((m) => m.Cell as never), { ssr: false }) as never;
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip as never), { ssr: false }) as never;
const Legend = dynamic(() => import('recharts').then((m) => m.Legend as never), { ssr: false }) as never;

interface PlanDistributionProps {
  distribution: { planId: string; planName: string; count: number; revenueVnd: number }[];
}

const COLORS = ['#0d9488', '#4f46e5', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

export function PlanDistribution({ distribution }: PlanDistributionProps) {
  const t = useTranslations('subscriptions');

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t('planDistribution')}</h3>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
        <PieChart width={500} height={240}>
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <Pie data={distribution} dataKey="count" nameKey="planName" cx="50%" cy="50%" outerRadius={90} label={({ planName, percent }: { planName: string; percent: number }) => `${planName} ${(percent * 100).toFixed(0)}%`}>
            {distribution.map((_, i) => (
              // @ts-expect-error recharts dynamic-import prop types are too narrow across versions
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <Tooltip formatter={(value: number | string) => `${value} subs`} />
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}
