/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from 'next/link';
import { HeartPulse, ShoppingBag, User, Activity, Bell, CreditCard, MapPin, Users } from 'lucide-react';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';

export function Header() {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(255, 255, 255, 0.95)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand */}
        <Link href="/" id="header-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)',
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Care<span style={{ color: 'var(--primary)' }}>Nest</span>
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '-3px' }}>
              MED-COMMERCE & IOT
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/products" id="nav-products" style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
            Thiết Bị Y Tế
          </Link>
          <Link href="/dashboard" id="nav-dashboard" style={{
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Activity size={18} />
            Theo Dõi Sức Khỏe
          </Link>
          <Link href="/subscription" style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={18} />
            Gói Dịch Vụ
          </Link>
          <Link href="/geofence" style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={18} />
            Vùng An Toàn
          </Link>
          <Link href="/caregivers" style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={18} />
            Người Chăm Sóc
          </Link>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LocaleSwitcher />
          <Link href="/cart" id="header-cart-btn" className="btn btn-secondary" style={{ padding: '8px 14px' }}>
            <ShoppingBag size={18} />
            <span>Giỏ hàng</span>
          </Link>
          <Link href="/login" id="header-login-btn" className="btn btn-primary" style={{ padding: '8px 18px' }}>
            <User size={18} />
            <span>Đăng nhập</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
