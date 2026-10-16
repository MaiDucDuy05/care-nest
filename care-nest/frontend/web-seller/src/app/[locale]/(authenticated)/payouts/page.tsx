'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Wallet, CheckCircle2, Clock, XCircle, RefreshCw, ArrowUpRight, ArrowDownRight, ListOrdered } from 'lucide-react';
import { payoutsService } from '@/lib/services/payouts.service';
import type { Payout, PayoutStatus, SellerWallet, WalletEntry, WalletEntryKind } from '@/lib/types';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.abs(n)) + ' đ';

const formatSignedVnd = (n: number) => (n >= 0 ? '+' : '−') + formatVnd(n);

const STATUS_BADGE: Record<PayoutStatus, string> = {
  PENDING: 'badge-amber',
  PROCESSING: 'badge-indigo',
  PAID: 'badge-green',
  FAILED: 'badge-red',
  REVERSED: 'badge-slate',
};

const STATUS_ICON: Record<PayoutStatus, JSX.Element> = {
  PENDING: <Clock size={14} />,
  PROCESSING: <RefreshCw size={14} />,
  PAID: <CheckCircle2 size={14} />,
  FAILED: <XCircle size={14} />,
  REVERSED: <XCircle size={14} />,
};

const ENTRY_BADGE: Record<WalletEntryKind, string> = {
  ORDER_CREDIT: 'badge-green',
  COMMISSION_DEBIT: 'badge-slate',
  REFUND_DEBIT: 'badge-red',
  PAYOUT_DEBIT: 'badge-indigo',
  ADJUSTMENT: 'badge-amber',
};

export default function PayoutsPage() {
  const t = useTranslations('payouts');
  const tCommon = useTranslations('common');
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [w, p, e] = await Promise.all([
          payoutsService.listWallet(),
          payoutsService.list({ pageSize: 50 }),
          payoutsService.listEntries({ pageSize: 50 }),
        ]);
        if (!mounted) return;
        setWallet(w);
        setPayouts(p.items);
        setEntries(e.items);
      } catch (err) {
        if (mounted) setError((err as Error).message);
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
        <div className="spinner" /> {tCommon('loading')}
      </div>
    );
  }
  if (error) {
    return <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 className="text-h2">{t('title')}</h1>
      <p className="text-muted">{t('subtitle')}</p>

      {wallet && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          <WalletCard
            icon={<Wallet size={20} />}
            label={t('balance')}
            value={formatVnd(wallet.balanceVnd)}
            tone="primary"
            hint={t('balanceHint')}
          />
          <WalletCard
            icon={<Clock size={20} />}
            label={t('pending')}
            value={formatVnd(wallet.pendingVnd)}
            tone="amber"
            hint={t('pendingHint')}
          />
          <WalletCard
            icon={<CheckCircle2 size={20} />}
            label={t('lifetime')}
            value={formatVnd(wallet.lifetimeVnd)}
            tone="slate"
            hint={t('lifetimeHint')}
          />
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListOrdered size={18} color="var(--text-muted)" />
          <h2 className="text-h3" style={{ margin: 0 }}>{t('timeline')}</h2>
        </div>
        <div style={{ padding: '0 16px 8px', color: 'var(--text-muted)', fontSize: 13 }}>
          {t('timelineSubtitle')}
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('emptyLedger')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>{t('time')}</th>
                <th style={{ width: 140 }}>{t('kind')}</th>
                <th>{t('description')}</th>
                <th style={{ textAlign: 'right', width: 140 }}>{t('amount')}</th>
                <th style={{ textAlign: 'right', width: 140 }}>{t('balance')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const positive = e.amountVnd >= 0;
                const labelKey = `kindLabels.${e.kind}` as const;
                return (
                  <tr key={e.id}>
                    <td className="text-sm text-muted">
                      {new Date(e.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <span
                        className={`badge ${ENTRY_BADGE[e.kind]}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {t(labelKey)}
                      </span>
                    </td>
                    <td className="text-sm">
                      {e.description || '—'}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        color: positive ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600,
                      }}
                    >
                      {formatSignedVnd(e.amountVnd)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {formatVnd(e.balanceAfterVnd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-h3" style={{ margin: 0 }}>{t('history')}</h2>
        </div>
        {payouts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('empty')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('id')}</th>
                <th>{t('amount')}</th>
                <th>{t('bankInfo')}</th>
                <th>{t('status')}</th>
                <th>{t('requested')}</th>
                <th>{t('paid')}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {p.id.slice(0, 8)}…
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatVnd(p.amountVnd)}</td>
                  <td>
                    <div className="text-sm">{p.bankName}</div>
                    <div className="text-sm text-muted" style={{ fontFamily: 'monospace' }}>
                      {p.bankAccount} — {p.bankAccountName}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {STATUS_ICON[p.status]} {p.status}
                    </span>
                    {p.failureReason && (
                      <div className="text-sm" style={{ color: 'var(--danger)', marginTop: 4 }}>
                        {p.failureReason}
                      </div>
                    )}
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(p.requestedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="text-sm text-muted">
                    {p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '—'}
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

function WalletCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'amber' | 'slate';
  hint: string;
}) {
  const toneColor: Record<typeof tone, string> = {
    primary: 'var(--primary)',
    amber: 'var(--warning, #d97706)',
    slate: 'var(--text-muted)',
  };
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: toneColor[tone] }}>
        {icon}
        <span style={{ fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="text-sm text-muted">{hint}</div>
    </div>
  );
}
