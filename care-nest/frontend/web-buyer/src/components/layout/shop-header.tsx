'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import {
  HeartPulse,
  ShoppingBag,
  User,
  Search,
  Activity,
  PhoneCall,
  ShieldCheck,
  Truck,
  Sparkles,
  Menu,
  X,
  Clock,
  ChevronRight,
  Package,
} from 'lucide-react';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { cartService, CART_UPDATED_EVENT } from '@/services/cart.service';
import { getToken } from '@/lib/api-client';
import { authService } from '@/services/auth.service';

export function ShopHeader() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  // Cập nhật số lượng giỏ hàng & trạng thái đăng nhập tức thì
  useEffect(() => {
    let isMounted = true;

    async function updateCartInfo() {
      try {
        const cart = await cartService.getCart();
        if (isMounted) {
          const totalQty = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        }
      } catch {
        // Silent catch
      }
    }

    const token = getToken();
    setIsLoggedIn(!!token);
    updateCartInfo();

    if (token) {
      authService.me(token).then((profile) => {
        if (isMounted && profile?.fullName) {
          setUserName(profile.fullName);
        }
      }).catch(() => {});
    }

    const handleCartUpdated = (e?: Event) => {
      if (e && 'detail' in e && (e as CustomEvent).detail?.items) {
        const cart = (e as CustomEvent).detail;
        const totalQty = (cart.items || []).reduce(
          (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
          0
        );
        setCartCount(totalQty);
        setIsCartBouncing(true);
        setTimeout(() => setIsCartBouncing(false), 700);
      } else {
        updateCartInfo();
        setIsCartBouncing(true);
        setTimeout(() => setIsCartBouncing(false), 700);
      }
      setIsLoggedIn(!!getToken());
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/shop/products');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* 1. Dải thông báo trên cùng (Top Utility Bar) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
              <PhoneCall size={13} /> Hotline Y Tế: <strong className="text-white">1900-6868</strong> (24/7)
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck size={13} className="text-teal-400" /> 100% Thiết Bị Y Tế Đạt Chuẩn Bộ Y Tế
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-400">
              <Truck size={13} className="text-teal-400" /> Giao Hỏa Tốc 2 Giờ Nội Thành
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop/cart"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Kiểm Tra Đơn Hàng
            </Link>
            <span className="text-slate-600">|</span>
            <LocaleSwitcher />
          </div>
        </div>
      </div>

      {/* 2. Thanh chính (Main Bar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo - Sàn Thương Mại CareNest Shop */}
        <Link
          href="/"
          id="header-brand-logo"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse size={24} />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              Care<span className="text-teal-600">Nest</span>
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">
                MALL
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
              Sàn Thương Mại Điện Tử Y Tế
            </div>
          </div>
        </Link>

        {/* Thanh Tìm Kiếm Sản Phẩm (Search Bar) */}
        <div className="flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              id="shop-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm máy đo huyết áp, máy tạo oxy, đồng hồ Wonlex SOS..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm text-slate-900 bg-slate-50/60 transition-all outline-none"
            />
            <Search size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <button
              type="submit"
              id="shop-search-btn"
              className="absolute right-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Cầu nối sang Dashboard Sức Khỏe & Actions */}
        <div className="flex items-center gap-3">
          {/* NÚT CHUYỂN ĐỔI CHUYÊN BIỆT: Sang Dashboard Theo Dõi Sức Khỏe */}
          <Link
            href="/health/dashboard"
            id="nav-to-health-dashboard"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-teal-300/80 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 font-semibold text-xs transition-all shadow-xs hover:shadow-sm"
            title="Mở bảng điều khiển theo dõi nhịp tim, huyết áp & vị trí người thân"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <Activity size={17} className="text-teal-700" />
            <div className="text-left leading-tight">
              <span className="block font-bold">Dashboard Sức Khỏe</span>
              <span className="text-[10px] text-teal-600 font-normal">Giám sát sinh tồn IoT &gt;</span>
            </div>
          </Link>

          {/* Giỏ Hàng */}
          <Link
            href="/shop/cart"
            id="header-cart-btn"
            className="relative inline-flex items-center justify-center p-2.5 rounded-xl text-slate-700 hover:text-teal-600 hover:bg-slate-100"
            title="Xem giỏ hàng"
          >
            <ShoppingBag
              size={22}
              className={`text-teal-600`}
            />
            {cartCount > 0 && (
              <span
                id="cart-badge-count"
                className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-xs transition-all duration-300 ${
                  isCartBouncing ? 'bg-emerald-600 scale-125 ring-2 ring-emerald-300' : 'bg-rose-600 scale-100'
                }`}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Đơn Hàng Của Tôi */}
          <Link
            href={isLoggedIn ? '/orders' : '/auth/login?redirect=/orders'}
            id="header-orders-btn"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-teal-600 hover:bg-slate-100 transition-colors"
            title="Đơn hàng của tôi"
          >
            <Package size={16} />
            <span>Đơn Hàng</span>
          </Link>

          {/* Đăng Nhập / Tài Khoản */}
          <Link
            href={isLoggedIn ? '/health/dashboard' : '/auth/login'}
            id="header-login-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <User size={16} />
            <span>{isLoggedIn ? (userName ? userName.split(' ').slice(-2).join(' ') : 'Tài Khoản') : 'Đăng Nhập'}</span>
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

      {/* 3. Thanh Danh Mục & Khuyến Mãi (Category Navigation Bar) */}
      <div className="border-t border-slate-100 bg-slate-50/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2 text-sm">
          <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap py-0.5">
            <Link
              href="/shop/products"
              id="nav-all-products"
              className="font-bold text-slate-900 hover:text-teal-600 transition-colors flex items-center gap-1.5"
            >
              Tất Cả Thiết Bị Y Tế
            </Link>
            <Link
              href="/shop/products?search=huyết+áp"
              className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
            >
              Máy Đo Huyết Áp
            </Link>
            <Link
              href="/shop/products?search=đồng+hồ"
              className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
            >
              Đồng Hồ Định Vị SOS
            </Link>
            <Link
              href="/shop/products?search=oxy"
              className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
            >
              Máy Tạo Oxy &amp; SpO2
            </Link>
            <Link
              href="/shop/products?search=hỗ+trợ"
              className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
            >
              Thiết Bị Hỗ Trợ Vận Động
            </Link>
            <Link
              href="/shop/products"
              className="inline-flex items-center gap-1 text-rose-600 font-semibold hover:text-rose-700 transition-colors"
            >
              <Sparkles size={14} /> Flash Sale Hôm Nay
            </Link>
          </nav>

          <div className="text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <Clock size={14} className="text-teal-600" /> Giao hàng 2H cho đơn y tế khẩn cấp
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm thiết bị y tế..."
              className="w-full pl-9 pr-20 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1 top-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-md"
            >
              Tìm
            </button>
          </form>

          {/* Link chuyển sang Health Dashboard trên Mobile */}
          <Link
            href="/health/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-teal-600" />
              <span>Chuyển Sang Dashboard Sức Khỏe</span>
            </div>
            <ChevronRight size={16} />
          </Link>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-sm font-medium">
            <Link
              href="/shop/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-800"
            >
              Tất Cả Thiết Bị Y Tế
            </Link>
            <Link
              href="/shop/products?search=huyết+áp"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-600"
            >
              Máy Đo Huyết Áp
            </Link>
            <Link
              href="/shop/products?search=đồng+hồ"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-600"
            >
              Đồng Hồ Định Vị SOS
            </Link>
            <Link
              href="/shop/products?search=oxy"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-600"
            >
              Máy Tạo Oxy &amp; SpO2
            </Link>
            <Link
              href="/shop/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-600"
            >
              Giỏ Hàng ({cartCount})
            </Link>
            <Link
              href={isLoggedIn ? '/orders' : '/auth/login?redirect=/orders'}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-teal-700 font-semibold"
            >
              📦 Đơn Hàng Của Tôi
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

