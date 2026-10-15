'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Plus, ScanLine } from 'lucide-react';
import { inventoryService } from '@/lib/services/inventory.service';
import { productsService } from '@/lib/services/products.service';
import type { Product, IMEIRecord } from '@/lib/types';

export default function ImeiPage() {
  const t = useTranslations('imei');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [imeis, setImeis] = useState<IMEIRecord[]>([]);
  const [scannerOn, setScannerOn] = useState(false);
  const [imei, setImei] = useState('');
  const [productId, setProductId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [p, i] = await Promise.all([productsService.list(), inventoryService.list()]);
      if (!mounted) return;
      setProducts(p);
      setImeis(i);
      if (p.length > 0 && !productId) setProductId(p[0].id);
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleAdd = async () => {
    if (!imei.trim() || !productId) {
      setError('Vui lòng nhập IMEI và chọn sản phẩm');
      return;
    }
    if (!/^\d{15}$/.test(imei.trim())) {
      setError('IMEI phải có 15 chữ số');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const created = await inventoryService.add(imei.trim(), productId);
      setImeis((prev) => [created, ...prev]);
      setImei('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <h1 className="text-h2">{t('title')}</h1>
      <p className="text-muted">{t('subtitle')}</p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${scannerOn ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setScannerOn(!scannerOn)}
          >
            <Camera size={16} /> {t('scan')}
          </button>
          <button
            type="button"
            className={`btn ${!scannerOn ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setScannerOn(false)}
          >
            <ScanLine size={16} /> {t('manual')}
          </button>
        </div>

        {scannerOn ? (
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Camera size={32} />
            <p style={{ marginTop: 8 }}>Camera scanner (qr-scanner integration stub)</p>
            <p className="text-sm">Nhập IMEI thủ công bên dưới trong khi chờ tích hợp</p>
          </div>
        ) : null}

        <div>
          <label className="label">{t('imei')}</label>
          <input
            className="input"
            placeholder="352099001761481"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            maxLength={15}
          />
        </div>

        <div>
          <label className="label">{t('product')}</label>
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: 8,
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={submitting}
        >
          {submitting ? <span className="spinner" /> : <><Plus size={16} /> {t('success')}</>}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{t('imei')}</th>
              <th>{t('product')}</th>
              <th>Trạng thái</th>
              <th>Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {imeis.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                  {tCommon('loading')}
                </td>
              </tr>
            ) : (
              imeis.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'monospace' }}>{i.imei}</td>
                  <td>{i.productName ?? i.productId}</td>
                  <td>
                    <span
                      className={`badge ${i.status === 'IN_STOCK' ? 'badge-green' : i.status === 'RESERVED' ? 'badge-amber' : 'badge-slate'}`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{new Date(i.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
