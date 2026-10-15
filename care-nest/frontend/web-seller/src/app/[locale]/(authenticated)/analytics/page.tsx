'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsService } from '@/lib/services/analytics.service';
import type { AnalyticsSummary } from '@/lib/types';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const summary = await analyticsService.summary(days);
        if (mounted) setData(summary);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [days]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-h2">{t('title')}</h1>
        <select className="select" style={{ width: 160 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>{t('revenue7d')}</option>
          <option value={30}>{t('revenue30d')}</option>
        </select>
      </div>

      {loading || !data ? (
        <div className="card" style={{ color: 'var(--text-muted)' }}>
          <div className="spinner" /> {tCommon('loading')}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <Stat label="Tổng doanh thu" value={formatVnd(data.totalRevenueVnd)} color="var(--success)" />
            <Stat label={t('ordersCount')} value={data.ordersCount.toString()} color="var(--secondary)" />
            <Stat label={t('averageOrder')} value={formatVnd(data.averageOrderVnd)} color="var(--accent)" />
          </div>

          <div className="card">
            <h2 className="text-h3" style={{ marginBottom: 16 }}>{t('revenue7d')}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => formatVnd(value)}
                  labelStyle={{ color: 'var(--text-main)' }}
                />
                <Bar dataKey="revenueVnd" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-h3" style={{ marginBottom: 16 }}>{t('topProducts')}</h2>
            {data.topProducts.length === 0 ? (
              <p className="text-muted">{t('noData')}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.productName}</td>
                      <td>{p.soldCount}</td>
                      <td style={{ fontWeight: 700 }}>{formatVnd(p.revenueVnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="text-muted text-sm">{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
