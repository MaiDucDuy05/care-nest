import Link from 'next/link';
import { HeartPulse, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="container" style={{
      maxWidth: '480px',
      paddingTop: '50px',
      paddingBottom: '80px',
    }}>
      <div className="card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: '#fff',
            marginBottom: '12px',
          }}>
            <HeartPulse size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            Tạo Tài Khoản CareNest
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Bắt đầu chăm sóc và bảo vệ sức khỏe người thân yêu
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Họ và tên
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <User size={18} color="var(--text-muted)" />
              <input
                id="register-name-input"
                type="text"
                placeholder="Nguyễn Văn A"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Địa chỉ Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <Mail size={18} color="var(--text-muted)" />
              <input
                id="register-email-input"
                type="email"
                placeholder="email@example.com"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Số điện thoại (Nhận cảnh báo SOS)
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <Phone size={18} color="var(--text-muted)" />
              <input
                id="register-phone-input"
                type="tel"
                placeholder="0912345678"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Mật khẩu (Tối thiểu 8 ký tự)
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}>
              <Lock size={18} color="var(--text-muted)" />
              <input
                id="register-password-input"
                type="password"
                placeholder="••••••••"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit' }}
                required
              />
            </div>
          </div>

          <button id="register-submit-btn" type="submit" className="btn btn-primary" style={{ padding: '12px', width: '100%', marginTop: '6px' }}>
            Hoàn tất đăng ký <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link href="/login" id="register-goto-login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
