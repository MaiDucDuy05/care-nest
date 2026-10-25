'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { authService, isBuyerPortalRole } from '@/services/auth.service';
import { DEMO_ACCOUNTS, type DemoAccount } from '@/lib/demo-accounts';

const BUYER_DEMO_ACCOUNTS = DEMO_ACCOUNTS.filter((account) => isBuyerPortalRole(account.role));

function LoginContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams?.get('redirect') || searchParams?.get('callbackUrl') || '/health/dashboard';
  const isBuyingRedirect = redirectUrl.includes('/shop') || redirectUrl.includes('/cart');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPass: string, personaName?: string) => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      await authService.login(loginEmail.trim(), loginPass);
      setSuccessMsg(
        personaName
          ? `Đăng nhập thành công với vai trò ${personaName}! Đang chuyển hướng...`
          : 'Đăng nhập thành công! Đang chuyển hướng...'
      );
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (err: unknown) {
      try {
        const parsed = JSON.parse((err as Error).message);
        setError(parsed.message || 'Đăng nhập không thành công');
      } catch {
        setError((err as Error).message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsLoading(false);
      setLoggingInAs(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickDemoLogin = async (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoId(acc.id);
    setLoggingInAs(acc.fullName);
    await performLogin(acc.email, acc.password, acc.fullName);
  };

  const handleSelectDemoToFill = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoId(acc.id);
    setError(null);
  };

  return (
    <div
      className="container"
      style={{
        maxWidth: '560px',
        paddingTop: '50px',
        paddingBottom: '80px',
      }}
    >
      <div className="card" style={{ padding: '36px 32px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            <HeartPulse size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {t('loginTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Hệ sinh thái thiết bị y tế IoT &amp; Giám sát sức khỏe gia đình 24/7
          </p>
        </div>

        {/* Thông báo nếu đang yêu cầu đăng nhập để mua hàng */}
        {isBuyingRedirect && (
          <div
            style={{
              background: 'var(--primary-light, #ccfbf1)',
              color: 'var(--primary-hover, #0f766e)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #99f6e4',
            }}
          >
            <ShoppingBag size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Yêu cầu đăng nhập để mua hàng:</strong> Chọn nhanh tài khoản Người Mua Hàng mẫu bên dưới để thanh toán ngay lập tức.
            </div>
          </div>
        )}

        {/* PRESET DEMO ACCOUNTS (Tài khoản mẫu chân thực) */}
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} className="text-amber-500" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                Tài Khoản Thử Nghiệm Có Sẵn (1-Click Presets)
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#e0e7ff',
                color: '#3730a3',
                fontWeight: 600,
              }}
            >
              Sandbox Ready
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>
            Chọn một hồ sơ mẫu bên dưới để đăng nhập tức thì mà không cần ghi nhớ thông tin:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {BUYER_DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedDemoId === acc.id;
              const isCurrentLogging = loggingInAs === acc.fullName && isLoading;

              return (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isSelected ? '#ffffff' : '#ffffffcc',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 2px 8px rgba(13, 148, 136, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    onClick={() => handleSelectDemoToFill(acc)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {acc.avatar}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {acc.fullName}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: acc.badgeBg,
                            color: acc.badgeText,
                          }}
                        >
                          {acc.roleName}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }} className="truncate">
                        {acc.email} • Ví: {new Intl.NumberFormat('vi-VN').format(acc.initialBalance)} đ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickDemoLogin(acc)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                      }}
                    >
                      {isCurrentLogging ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Đang vào...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          <span>1-Chạm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-light, #fee2e2)',
              color: 'var(--danger, #dc2626)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form nhập truyền thống */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t('email')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
              }}
            >
              <Mail size={18} color="var(--text-muted)" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>{t('password')}</label>
              <Link href="#" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                {t('forgotPassword')}
              </Link>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
              }}
            >
              <Lock size={18} color="var(--text-muted)" />
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ padding: '12px', width: '100%', marginTop: '5px' }}
          >
            {isLoading && !loggingInAs ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} className="animate-spin" /> Đang đăng nhập...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {t('loginBtn')} <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          {t('noAccount')}{' '}
          <Link
            href={`/auth/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            id="login-goto-register"
            style={{ color: 'var(--primary)', fontWeight: 700 }}
          >
            {t('registerNow')}
          </Link>
        </div>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Bảo mật 2 lớp SSL 256-bit &amp; Tuân thủ tiêu chuẩn dữ liệu y tế HL7/FHIR</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
          <div className="animate-spin text-teal-600 font-bold">Đang tải trang đăng nhập...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
