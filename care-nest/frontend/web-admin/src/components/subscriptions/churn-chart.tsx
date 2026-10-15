'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const LineChart = dynamic(
  () => import('recharts').then((m) => m.LineChart as never),
  { ssr: false, loading: () => <div style={{ height: '200px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }} /> },
) as never;
const Line = dynamic(() => import('recharts').then((m) => m.Line as never), { ssr: false }) as never;
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis as never), { ssr: false }) as never;
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis as never), { ssr: false }) as never;
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid as never), { ssr: false }) as never;
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip as never), { ssr: false }) as never;

interface ChurnChartProps {
  data: { month: string; rate: number }[];
}

export function ChurnChart({ data }: ChurnChartProps) {
  const t = useTranslations('subscriptions');

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t('churnTrend')}</h3>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
        <LineChart width={500} height={200} data={data}>
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" tickFormatter={(v: number) => `${v}%`} domain={[0, 'auto']} />
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <Tooltip formatter={(v: number | string) => `${Number(v).toFixed(2)}%`} />
          {/* @ts-expect-error recharts dynamic-import prop types are too narrow across versions */}
          <Line type="monotone" dataKey="rate" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </div>
    </div>
  );
}
