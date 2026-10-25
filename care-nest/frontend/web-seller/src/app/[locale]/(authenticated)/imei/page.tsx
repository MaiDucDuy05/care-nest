'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, ScanLine, Upload } from 'lucide-react';
import { imeiService, isValidImei } from '@/lib/services/imei.service';
import { productsService } from '@/lib/services/products.service';
import type { Product, IMEIRecord, IMEIStatus } from '@/lib/types';

const STATUS_BADGE: Record<IMEIStatus, string> = {
  IN_STOCK: 'badge-green',
  RESERVED: 'badge-amber',
  SHIPPED: 'badge-blue',
  ACTIVATED: 'badge-slate',
  RETURNED: 'badge-slate',
  FAULTY: 'badge-red',
};

const STATUS_I18N_MAP: Record<IMEIStatus, 'inStock' | 'reserved' | 'shipped' | 'activated' | 'returned' | 'faulty'> = {
  IN_STOCK: 'inStock',
  RESERVED: 'reserved',
  SHIPPED: 'shipped',
  ACTIVATED: 'activated',
  RETURNED: 'returned',
  FAULTY: 'faulty',
};

export default function ImeiPage() {
  const t = useTranslations('imei');
  const tInv = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [imeis, setImeis] = useState<IMEIRecord[]>([]);
  const [loadingImeis, setLoadingImeis] = useState(true);
  const [imeiLoadError, setImeiLoadError] = useState(false);
  const [productId, setProductId] = useState('');
  const [imeiText, setImeiText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scannerOn, setScannerOn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [productsResult, imeisResult] = await Promise.allSettled([
        productsService.list(),
        imeiService.list(),
      ]);
      if (!mounted) return;

      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value);
        if (productsResult.value.length > 0) {
          setProductId((current) => current || productsResult.value[0].id);
        }
      } else {
        setError(productsResult.reason instanceof Error ? productsResult.reason.message : tCommon('error'));
      }

      if (imeisResult.status === 'fulfilled') {
        setImeis(imeisResult.value);
      } else {
        setImeiLoadError(true);
      }
      setLoadingImeis(false);
    })();
    return () => {
      mounted = false;
    };
  }, [tCommon]);

  const reloadImeis = async () => {
    setLoadingImeis(true);
    setImeiLoadError(false);
    try {
      setImeis(await imeiService.list());
    } catch {
      setImeiLoadError(true);
    } finally {
      setLoadingImeis(false);
    }
  };

  const handleImport = async () => {
    if (!productId) {
      setError('Vui lòng chọn sản phẩm');
      return;
    }
    // Accept newline, comma, or space separated. Strip empties.
    const imeis = imeiText
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (imeis.length === 0) {
      setError('Vui lòng nhập ít nhất một IMEI (mỗi dòng / phẩy / khoảng trắng)');
      return;
    }
    // Client-side Luhn check first
    const invalid = imeis.filter((i) => !isValidImei(i));
    if (invalid.length > 0) {
      setError(`${invalid.length} IMEI không hợp lệ: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}`);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const res = await imeiService.bulkImport({ productId, imeis });
      setSuccess(`Đã nhập ${res.imported} IMEI${res.skipped > 0 ? `, bỏ qua ${res.skipped}` : ''}`);
      setImeiText('');
      // refresh list
      const fresh = await imeiService.list({ productId });
      setImeis(fresh);
      setImeiLoadError(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div>
        <h1 className="text-h2">{t('title')}</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>{t('subtitle')}</p>
      </div>

      <div className="imei-grid-layout">
        {/* Left Column: Input Form Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 24,
          }}
        >
          <div>
            <h2 className="text-h3" style={{ fontSize: 16, marginBottom: 4 }}>
              {t('addNew')}
            </h2>
            <p className="text-sm text-muted">{t('addNewDesc')}</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn ${scannerOn ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScannerOn(!scannerOn)}
              style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
            >
              <Camera size={16} /> {t('scan')}
            </button>
            <button
              type="button"
              className={`btn ${!scannerOn ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScannerOn(false)}
              style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
            >
              <ScanLine size={16} /> {t('manual')}
            </button>
          </div>

          {scannerOn ? (
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 32,
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Camera size={32} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 8, fontWeight: 500, color: 'var(--text-main)' }}>
                Camera scanner
              </p>
              <p className="text-sm">Quét mã vạch hoặc nhập mã IMEI bên dưới</p>
            </div>
          ) : null}

          <div>
            <label className="label">{t('product')}</label>
            <select
              className="select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                  {p.requiresImei ? ' · IMEI' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              {t('imei')} (mỗi dòng một IMEI, hoặc cách nhau dấu phẩy)
            </label>
            <textarea
              className="textarea"
              rows={6}
              placeholder={'352099001761488\n490154203237518\n...'}
              value={imeiText}
              onChange={(e) => setImeiText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: 'var(--success-light, #ecfdf5)',
                color: 'var(--success, #047857)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? (
              <span className="spinner" />
            ) : (
              <>
                <Upload size={16} /> {t('saveImei')}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Inventory Table Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <h2 className="text-h3" style={{ fontSize: 16 }}>
                {t('recentList')}
              </h2>
              <p className="text-sm text-muted" style={{ marginTop: 2 }}>
                {t('recentListDesc')}
              </p>
            </div>
            <span className="badge badge-slate" style={{ fontSize: 12 }}>
              {t('devicesCount', { count: imeis.length })}
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t('imei')}</th>
                <th>{t('product')}</th>
                <th>{t('status')}</th>
                <th>{t('createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingImeis ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    <div className="spinner" style={{ marginRight: 8 }} /> {tCommon('loading')}
                  </td>
                </tr>
              ) : imeiLoadError ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--danger)', padding: 32 }}>
                    {t('listLoadError')}{' '}
                    <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={reloadImeis}>
                      {tCommon('retry')}
                    </button>
                  </td>
                </tr>
              ) : imeis.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
                    {t('emptyList')}
                  </td>
                </tr>
              ) : (
                imeis.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{i.imei}</td>
                    <td>{i.productName ?? i.productId}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[i.status]}`}>
                        {tInv(STATUS_I18N_MAP[i.status] ?? 'inStock')}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
