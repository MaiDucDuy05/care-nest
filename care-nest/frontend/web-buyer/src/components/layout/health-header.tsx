'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import {
  Activity,
  MapPin,
  Users,
  CreditCard,
  PlusCircle,
  Bell,
  ShoppingBag,
  ShieldAlert,
  User,
  Menu,
  X,
  PhoneCall,
} from 'lucide-react';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { getToken } from '@/lib/api-client';

export function HealthHeader() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  const navItems = [
    {
      href: '/health/dashboard',
      label: 'Tổng Quan Sinh Tồn',
      icon: Activity,
      exact: true,
    },
    {
      href: '/health/geofence',
      label: 'Vùng An Toàn GPS',
      icon: MapPin,
    },
    {
      href: '/health/caregivers',
      label: 'Người Chăm Sóc',
      icon: Users,
    },
    {
      href: '/subscription',
      label: 'Gói Cước & SIM IoT',
      icon: CreditCard,
    },
    {
      href: '/activation',
      label: 'Kích Hoạt Thiết Bị',
      icon: PlusCircle,
    },
    {
      href: '/settings/notifications',
      label: 'Cài Đặt Cảnh Báo',
      icon: Bell,
    },
  ];

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        {/* 1. Thanh Cấp Cứu & Trạng Thái Máy Chủ Telemetry (Emergency & Status Bar) */}
        <div className="bg-rose-950 text-rose-100 text-xs py-1.5 px-4 border-b border-rose-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 font-bold text-rose-300">
                <ShieldAlert size={14} className="text-rose-400 animate-pulse" />
                CẤP CỨU Y TẾ KHẨN CẤP: <strong className="text-white text-sm">115</strong>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-rose-200/80">
                <PhoneCall size={13} /> Hotline Hỗ Trợ IoT: <strong>1900-6868</strong> (24/7)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                IoT Telemetry: Trực Tuyến (&lt; 40ms)
              </span>
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        {/* 2. Thanh Chính (Main Health Dashboard Bar) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo Dashboard Chuyên Biệt */}
          <Link
            href="/health/dashboard"
            id="health-brand-logo"
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                Care<span className="text-teal-600">Nest</span>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  Health OS
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Trung Tâm Giám Sát Sức Khỏe Gia Đình
              </div>
            </div>
          </Link>

          {/* Quick Actions & Cầu Nối Quay Lại Sàn Mua Sắm TMĐT */}
          <div className="flex items-center gap-3">
            {/* NÚT BÁO ĐỘNG SOS KHẨN CẤP */}
            <button
              onClick={() => setSosModalOpen(true)}
              id="header-sos-emergency-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md transition-all animate-pulse"
              title="Kích hoạt báo động khẩn cấp tới danh sách người chăm sóc"
            >
              <ShieldAlert size={16} />
              <span className="hidden sm:inline">Phát Tín Hiệu</span> SOS
            </button>

            {/* NÚT CHUYỂN ĐỔI CHUYÊN BIỆT: Sang Sàn Mua Sắm Y Tế TMĐT */}
            <Link
              href="/"
              id="nav-to-shop-mall"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-800 hover:text-teal-900 font-semibold text-xs transition-all shadow-xs"
              title="Chuyển sang sàn thương mại điện tử để mua thiết bị y tế & phụ kiện"
            >
              <ShoppingBag size={17} className="text-teal-600" />
              <div className="text-left leading-tight hidden sm:block">
                <span className="block font-bold">Sàn Mua Sắm Y Tế</span>
                <span className="text-[10px] text-slate-500 font-normal">Cửa hàng CareNest Mall &gt;</span>
              </div>
            </Link>

            {/* Tài Khoản / Đăng Nhập */}
            <Link
              href={isLoggedIn ? '/health/dashboard' : '/auth/login'}
              id="health-header-user-btn"
              className="p-2.5 rounded-xl text-slate-700 hover:text-teal-600 hover:bg-slate-100 transition-colors"
              title={isLoggedIn ? 'Tài khoản giám sát' : 'Đăng nhập'}
            >
              <User size={20} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. Thanh Điều Hướng Dashboard Chuyên Biệt (Dedicated Health Tabs) */}
        <div className="border-t border-slate-200 bg-slate-50/90 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 overflow-x-auto py-1.5 -mb-px">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const active = isItemActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-white text-teal-700 shadow-xs border border-teal-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <IconComponent
                      size={17}
                      className={active ? 'text-teal-600' : 'text-slate-400'}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bảng Điều Khiển Sức Khỏe
            </div>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const active = isItemActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComponent size={18} className={active ? 'text-teal-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-100">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-teal-600" />
                  <span>Về Sàn Mua Sắm Y Tế CareNest</span>
                </div>
                <span className="text-xs text-slate-500 font-bold">&gt;</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SOS Alert Confirmation Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} className="animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Kích Hoạt Báo Động SOS Khẩn Cấp?
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
              Hệ thống sẽ ngay lập tức gửi tín hiệu cảnh báo vị trí GPS và gọi điện khẩn cấp đến toàn bộ danh bạ người chăm sóc đã thiết lập.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSosModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  alert('Tín hiệu SOS đã được gửi thành công đến trung tâm điều phối và danh bạ người chăm sóc!');
                  setSosModalOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm text-white shadow-md transition-colors"
              >
                Xác Nhận SOS (115)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

