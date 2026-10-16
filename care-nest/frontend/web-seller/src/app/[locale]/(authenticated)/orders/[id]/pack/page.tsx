'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { ordersService } from '@/lib/services/orders.service';
import { imeiService, isValidImei } from '@/lib/services/imei.service';
import type { Order } from '@/lib/types';

export default function PackOrderPage({ params }: { params: { id: string } }) {
  const t = useTranslations('orders');
  const tImei = useTranslations('imei');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imeiInputs, setImeiInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await ordersService.getById(params.id);
        if (!mounted) return;
        setOrder(data);
        // Pre-fill imei inputs with one row per quantity
        const initial: Record<string, string> = {};
        data.items.forEach((it) => {
          for (let i = 0; i < it.quantity; i++) initial[`${it.id}-${i}`] = '';
        });
        setImeiInputs(initial);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const addImeiRow = (orderItemId: string) => {
    const existing = Object.keys(imeiInputs).filter((k) => k.startsWith(orderItemId + '-')).length;
    setImeiInputs((prev) => ({ ...prev, [`${orderItemId}-${existing}`]: '' }));
  };

  const removeImeiRow = (key: string) => {
    setImeiInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!order) return;
    // Group IMEIs by orderItemId
    const grouped: Record<string, { imeis: string[]; productId: string }> = {};
    Object.entries(imeiInputs).forEach(([key, value]) => {
      const imei = value.trim();
      if (!imei) return;
      const orderItemId = key.split('-').slice(0, -1).join('-');
      if (!grouped[orderItemId]) grouped[orderItemId] = { imeis: [], productId: '' };
      grouped[orderItemId].imeis.push(imei);
    });

    // Validate: count + Luhn
    for (const it of order.items) {
      const entry = grouped[it.id];
      const have = entry?.imeis.length ?? 0;
      if (have < it.quantity) {
        setSubmitError(`Cần ${it.quantity} IMEI cho "${it.productName}", mới có ${have}`);
        return;
      }
      for (const imei of entry!.imeis) {
        if (!isValidImei(imei)) {
          setSubmitError(`IMEI "${imei}" không hợp lệ (Luhn check failed)`);
          return;
        }
      }
      entry!.productId = it.productId;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      // 1. Allocate IMEIs (RESERVED status)
      for (const [orderItemId, { imeis, productId }] of Object.entries(grouped)) {
        await imeiService.allocate({ orderId: order.id, orderItemId, productId, imeis });
      }
      // 2. Move order to PACKING
      await ordersService.updateStatus(order.id, 'PACKING');
      router.replace(`/orders/${order.id}`);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        <div className="spinner" /> {tCommon('loading')}
      </div>
    );
  }
  if (!order) return <div>Order not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <Link href={`/orders/${order.id}`} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> {tCommon('back')}
      </Link>

      <h1 className="text-h2">{t('packing.title')}</h1>
      <p className="text-muted">{t('packing.instructions')}</p>

      {order.items.map((it) => {
        const rows = Object.keys(imeiInputs).filter((k) => k.startsWith(it.id + '-'));
        const filledCount = rows.filter((k) => isValidImei(imeiInputs[k].trim())).length;
        return (
          <div key={it.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{it.productName}</strong>
              <span className="text-muted text-sm">
                {tImei('scanned')}: {filledCount}/{it.quantity}
              </span>
            </div>
            {rows.map((key) => {
              const val = imeiInputs[key].trim();
              const invalid = val.length > 0 && !isValidImei(val);
              return (
                <div key={key} style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    placeholder={tImei('imei')}
                    value={imeiInputs[key]}
                    onChange={(e) =>
                      setImeiInputs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    style={invalid ? { borderColor: 'var(--danger)' } : undefined}
                  />
                  {rows.length > it.quantity && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeImeiRow(key)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => addImeiRow(it.id)}
            >
              <Plus size={14} /> {tImei('manual')}
            </button>
          </div>
        );
      })}

      {submitError && (
        <div
          style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: 8,
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          {submitError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <span className="spinner" /> : t('packing.submit')}
        </button>
      </div>
    </div>
  );
}
