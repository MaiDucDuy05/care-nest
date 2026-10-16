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

export default function ImeiPage() {
  const t = useTranslations('imei');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [imeis, setImeis] = useState<IMEIRecord[]>([]);
  const [productId, setProductId] = useState('');
  const [imeiText, setImeiText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scannerOn, setScannerOn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [p, i] = await Promise.all([productsService.list(), imeiService.list()]);
      if (!mounted) return;
      setProducts(p);
      setImeis(i);
      if (p.length > 0) setProductId((cur) => cur || p[0].id);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
            <p className="text-sm">Quét từng IMEI hoặc nhập thủ công bên dưới</p>
          </div>
        ) : null}

        <div>
          <label className="label">{t('product')}</label>
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
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
          <label className="label">{t('imei')} (mỗi dòng một IMEI, hoặc phân cách bằng dấu phẩy)</label>
          <textarea
            className="textarea"
            rows={6}
            placeholder={'352099001761488\n490154203237518\n...'}
            value={imeiText}
            onChange={(e) => setImeiText(e.target.value)}
          />
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
        {success && (
          <div
            style={{
              background: 'var(--success-light, #ecfdf5)',
              color: 'var(--success, #047857)',
              padding: 8,
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
        >
          {submitting ? <span className="spinner" /> : <><Upload size={16} /> {t('success')}</>}
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
                    <span className={`badge ${STATUS_BADGE[i.status]}`}>{i.status}</span>
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
