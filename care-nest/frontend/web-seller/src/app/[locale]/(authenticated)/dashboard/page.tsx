'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ordersService } from '@/lib/services/orders.service';
import { productsService } from '@/lib/services/products.service';
import { inventoryService } from '@/lib/services/inventory.service';
import { analyticsService } from '@/lib/services/analytics.service';
import { ShoppingCart, TrendingUp, AlertTriangle, Boxes } from 'lucide-react';
import type { Order, Product, IMEIRecord, AnalyticsSummary } from '@/lib/types';

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tOrder = useTranslations('orders.statuses');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [imeis, setImeis] = useState<IMEIRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [o, p, i, a] = await Promise.all([
          ordersService.list(),
          productsService.list(),
          inventoryService.list(),
          analyticsService.summary(1),
        ]);
        if (!mounted) return;
        setOrders(o);
        setProducts(p);
        setImeis(i);
        setAnalytics(a);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const lowStock = products.filter((p) => p.stock < 5);
  const inStockImeis = imeis.filter((i) => i.status === 'IN_STOCK');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-h2" style={{ marginBottom: 4 }}>
          {t('title')}
        </h1>
        <p className="text-muted">{t('welcome')}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          icon={<ShoppingCart size={20} />}
          label={t('pendingOrders')}
          value={pendingOrders.length.toString()}
          color="var(--accent)"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label={t('todayRevenue')}
          value={formatVnd(analytics?.totalRevenueVnd ?? 0)}
          color="var(--success)"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label={t('lowStock')}
          value={lowStock.length.toString()}
          color="var(--danger)"
        />
        <StatCard
          icon={<Boxes size={20} />}
          label={t('inStock')}
          value={inStockImeis.length.toString()}
          color="var(--secondary)"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div className="card">
          <h2 className="text-h3" style={{ marginBottom: 16 }}>
            {pendingOrders.length > 0 ? 'Đơn chờ xử lý' : 'Không có đơn chờ'}
          </h2>
          {pendingOrders.slice(0, 5).map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{o.orderNumber}</div>
                <div className="text-muted text-sm">{o.buyerName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{formatVnd(o.totalVnd)}</div>
                <div className="text-sm" style={{ color: 'var(--accent)' }}>
                  {tOrder(o.status)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="card">
          <h2 className="text-h3" style={{ marginBottom: 16 }}>
            Sản phẩm sắp hết
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-muted text-sm">Mọi sản phẩm đều còn đủ hàng</p>
          ) : (
            lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}/edit`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="text-muted text-sm">{p.sku}</div>
                </div>
                <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.stock}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'var(--bg-card-subtle)',
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-muted text-sm">{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}
