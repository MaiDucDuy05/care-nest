'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { productsService } from '@/lib/services/products.service';
import type { Product, ProductStatus } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default function ProductsListPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await productsService.list({
          search: search || undefined,
          status: statusFilter || undefined,
        });
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    await productsService.remove(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-h2">{t('title')}</h1>
        <Link href="/products/new" className="btn btn-primary">
          <Plus size={16} /> {t('addNew')}
        </Link>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12 }}>
        <input
          className="input"
          placeholder={tCommon('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">{t('active')}</option>
          <option value="INACTIVE">{t('inactive')}</option>
          <option value="DRAFT">{t('draft')}</option>
        </select>
      </div>

      {error && <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--text-muted)' }}>
            <div className="spinner" /> {tCommon('loading')}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('empty')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('sku')}</th>
                <th>{t('price')}</th>
                <th>{t('stock')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="text-sm text-muted">{p.categoryName}</div>
                  </td>
                  <td>{p.sku}</td>
                  <td style={{ fontWeight: 600 }}>{formatVnd(p.priceVnd)}</td>
                  <td style={{ color: p.stock < 5 ? 'var(--danger)' : 'var(--text-main)' }}>{p.stock}</td>
                  <td>
                    <span className={`badge badge-${p.status === 'ACTIVE' ? 'green' : p.status === 'DRAFT' ? 'amber' : 'slate'}`}>
                      {p.status === 'ACTIVE' ? t('active') : p.status === 'DRAFT' ? t('draft') : t('inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/products/${p.id}/edit`} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', color: 'var(--danger)' }}
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
