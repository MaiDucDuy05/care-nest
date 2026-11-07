'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ListOrdered,
  Plus,
  ArrowDownLeft,
  X,
  Loader2,
  Building2,
} from 'lucide-react';
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

  // Modal states
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(5000000);
  const [topupNote, setTopupNote] = useState('');
  const [isTopupSubmitting, setIsTopupSubmitting] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10000000);
  const [bankName, setBankName] = useState('Ngân hàng Quân Đội (MBBank)');
  const [bankAccount, setBankAccount] = useState('0987654321');
  const [bankAccountName, setBankAccountName] = useState('WONLEX VIETNAM OFFICIAL');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount <= 0) {
      setTopupError('Số tiền nạp phải lớn hơn 0 đ');
      return;
    }
    setIsTopupSubmitting(true);
    setTopupError(null);
    try {
      const res = await payoutsService.topup({ amountVnd: topupAmount, note: topupNote });
      if (wallet) {
        setWallet({
          ...wallet,
          balanceVnd: res.balanceVnd,
          lifetimeVnd: (wallet.lifetimeVnd || 0) + topupAmount,
        });
      }
      if (res.entry) {
        setEntries((prev) => [res.entry, ...prev]);
      }
      setShowTopupModal(false);
      showToast(`Đã nạp thành công ${formatVnd(topupAmount)} vào ví gian hàng!`);
    } catch (err: unknown) {
      setTopupError(err instanceof Error ? err.message : 'Nạp tiền thất bại');
    } finally {
      setIsTopupSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      setWithdrawError('Số tiền rút phải lớn hơn 0 đ');
      return;
    }
    if (wallet && withdrawAmount > wallet.balanceVnd) {
      setWithdrawError('Số dư khả dụng không đủ để rút số tiền này');
      return;
    }
    setIsWithdrawSubmitting(true);
    setWithdrawError(null);
    try {
      const res = await payoutsService.withdraw({
        amountVnd: withdrawAmount,
        bankName,
        bankAccount,
        bankAccountName,
      });
      if (wallet) {
        setWallet({
          ...wallet,
          balanceVnd: res.balanceVnd,
        });
      }
      if (res.payout) {
        setPayouts((prev) => [res.payout, ...prev]);
      }
      if (res.entry) {
        setEntries((prev) => [res.entry, ...prev]);
      }
      setShowWithdrawModal(false);
      showToast(`Đã gửi yêu cầu rút ${formatVnd(withdrawAmount)} về tài khoản ${bankAccount}!`);
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : 'Yêu cầu rút tiền thất bại');
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

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
      {/* Toast thông báo thành công */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#047857',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header trang và các nút Nạp tiền / Rút tiền */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-h2" style={{ margin: '0 0 6px 0' }}>{t('title')}</h1>
          <p className="text-muted" style={{ margin: 0 }}>{t('subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0d9488',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(13,148,136,0.25)',
            }}
          >
            <Plus size={16} />
            <span>Nạp tiền vào ví</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="btn btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            <ArrowUpRight size={16} />
            <span>Yêu cầu rút tiền</span>
          </button>
        </div>
      </div>

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

      {/* MODAL NẠP TIỀN VÀO VÍ */}
      {showTopupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f0fdfa',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Nạp Tiền Vào Ví Gian Hàng
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Bổ sung số dư phục vụ quản lý ví &amp; đối soát</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTopup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Chọn nhanh số tiền nạp:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[1000000, 5000000, 10000000, 20000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: topupAmount === amt ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        background: topupAmount === amt ? '#f0fdfa' : '#f8fafc',
                        color: topupAmount === amt ? '#0f766e' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {formatVnd(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Hoặc nhập số tiền (VNĐ):
                </label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f766e',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú giao dịch (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nạp tiền đối soát hoặc thanh toán phí dịch vụ"
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {topupError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>
                  {topupError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isTopupSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isTopupSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang nạp tiền...
                    </>
                  ) : (
                    <span>Xác nhận nạp {formatVnd(topupAmount)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU RÚT TIỀN */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Yêu Cầu Rút Tiền Về Ngân Hàng
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Chuyển khoản trực tiếp vào tài khoản KYC</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Số dư khả dụng:</span>
                <strong style={{ fontSize: '18px', color: '#0f766e' }}>{formatVnd(wallet?.balanceVnd || 0)}</strong>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(wallet?.balanceVnd || 0)}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0d9488',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Rút toàn bộ
              </button>
            </div>

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Số tiền muốn rút (VNĐ):
                </label>
                <input
                  type="number"
                  min={50000}
                  max={wallet?.balanceVnd || 1000000000}
                  step={50000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ngân hàng thụ hưởng:
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Tên chủ tài khoản:
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              {withdrawError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>
                  {withdrawError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#4338ca',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isWithdrawSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang tạo lệnh...
                    </>
                  ) : (
                    <span>Xác nhận rút {formatVnd(withdrawAmount)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* MODAL NẠP TIỀN VÀO VÍ */}
      {showTopupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f0fdfa',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Nạp Tiền Vào Ví Gian Hàng
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Bổ sung số dư phục vụ quản lý ví &amp; đối soát</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTopup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Chọn nhanh số tiền nạp:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[1000000, 5000000, 10000000, 20000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: topupAmount === amt ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        background: topupAmount === amt ? '#f0fdfa' : '#f8fafc',
                        color: topupAmount === amt ? '#0f766e' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {formatVnd(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Hoặc nhập số tiền (VNĐ):
                </label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f766e',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ghi chú giao dịch (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nạp tiền đối soát hoặc thanh toán phí dịch vụ"
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {topupError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>
                  {topupError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isTopupSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isTopupSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang nạp tiền...
                    </>
                  ) : (
                    <span>Xác nhận nạp {formatVnd(topupAmount)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU RÚT TIỀN */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Yêu Cầu Rút Tiền Về Ngân Hàng
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Chuyển khoản trực tiếp vào tài khoản KYC</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Số dư khả dụng:</span>
                <strong style={{ fontSize: '18px', color: '#0f766e' }}>{formatVnd(wallet?.balanceVnd || 0)}</strong>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(wallet?.balanceVnd || 0)}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0d9488',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Rút toàn bộ
              </button>
            </div>

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Số tiền muốn rút (VNĐ):
                </label>
                <input
                  type="number"
                  min={50000}
                  max={wallet?.balanceVnd || 1000000000}
                  step={50000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Ngân hàng thụ hưởng:
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Tên chủ tài khoản:
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              {withdrawError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>
                  {withdrawError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#4338ca',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isWithdrawSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang tạo lệnh...
                    </>
                  ) : (
                    <span>Xác nhận rút {formatVnd(withdrawAmount)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
