'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Heart,
  Activity,
  ArrowRight,
  Watch,
  Thermometer,
  Wind,
  CheckCircle2,
  Package,
  PackageOpen,
  Sparkles,
  ShoppingBag,
  Truck,
  RotateCcw,
  Star,
  Check,
  Loader2,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { publicCatalogService, type PublicProduct } from '@/lib/services/public-catalog.service';
import { cartService, emitCartUpdated } from '@/services/cart.service';
import { Skeleton } from '@/components/ui/skeleton';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

export default function HomePage() {

  // State quản lý sản phẩm từ API Catalog
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Đếm ngược Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch danh sách sản phẩm thật từ Catalog Service
  useEffect(() => {
    let isMounted = true;

    async function fetchFeaturedProducts() {
      try {
        setIsLoadingProducts(true);
        const res = await publicCatalogService.listProducts({ pageSize: 12 });
        if (isMounted) {
          if (res?.items && Array.isArray(res.items)) {
            setProducts(res.items);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn('Catalog API error:', err);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    fetchFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Thêm nhanh vào giỏ hàng
  const handleQuickAddToCart = async (product: PublicProduct) => {
    setAddingId(product.id);
    try {
      const updatedCart = await cartService.addItem({
        productId: product.id,
        sellerId: product.seller?.id || 'care-nest-store',
        name: product.name,
        unitPrice: product.basePrice,
        quantity: 1,
        imageUrl: product.images?.[0]?.url,
      });
      setAddedIds((prev) => new Set(prev).add(product.id));
      emitCartUpdated(updatedCart);
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, 2500);
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err);
    } finally {
      setAddingId(null);
    }
  };

  // Danh mục thiết bị y tế nổi bật
  const visualCategories = [
    {
      title: 'Máy Đo Huyết Áp Bắp Tay',
      desc: 'Đo tự động, cảnh báo rung nhĩ AFib',
      search: 'huyết áp',
      icon: Heart,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      badge: 'Bán chạy nhất',
    },
    {
      title: 'Đồng Hồ Định Vị & SOS',
      desc: 'Cảm biến ngã, đàm thoại 4G khẩn cấp',
      search: 'đồng hồ',
      icon: Watch,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      badge: 'Công nghệ IoT',
    },
    {
      title: 'Máy Tạo Oxy & Đo SpO2',
      desc: 'Cung cấp oxy tinh khiết 93% liên tục',
      search: 'oxy',
      icon: Wind,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      badge: 'Y tế gia đình',
    },
    {
      title: 'Máy Đo Đường Huyết',
      desc: 'Kết quả sau 5s, không đau, lưu lịch sử',
      search: 'đường huyết',
      icon: Thermometer,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: 'Tiêu chuẩn ISO',
    },
    {
      title: 'Xe Lăn & Hỗ Trợ Vận Động',
      desc: 'Khung nhôm siêu nhẹ, phanh an toàn',
      search: 'hỗ trợ',
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: 'Chính hãng 100%',
    },
    {
      title: 'Vật Tư Y Tế & Chăm Sóc',
      desc: 'Băng gạc tiệt trùng, cồn sát khuẩn',
      search: 'y tế',
      icon: Package,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: 'Tiêu hao y tế',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Hero Banner Sàn Thương Mại Điện Tử */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-slate-50 to-white pt-10 pb-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Cột trái: Thông điệp bán hàng & Khuyến mãi */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 shadow-xs mb-5">
              <Sparkles size={14} className="text-teal-600" />
              SÀN THƯƠNG MẠI ĐIỆN TỬ Y TẾ CHÍNH HÃNG 2026
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-5">
              Chăm Sóc Sức Khỏe Gia Đình Với Thiết Bị Y Tế Chuẩn Y Khoa
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl">
              Nền tảng mua sắm thiết bị y tế chính hãng đã qua kiểm định Bộ Y Tế. Đầy đủ máy đo huyết áp,
              máy tạo oxy, que thử đường huyết và đồng hồ cảnh báo té ngã SOS thông minh với chính sách
              bảo hành 1 đổi 1 trong 24 tháng.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/shop/products"
                id="hero-cta-shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ShoppingBag size={18} />
                Khám Phá Toàn Bộ Thiết Bị
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/shop/products?search=đồng+hồ"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all duration-200"
              >
                <Watch size={18} className="text-teal-600" />
                Thiết Bị IoT Giám Sát SOS
              </Link>
            </div>

            {/* 3 Cam kết nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-9 pt-7 border-t border-slate-200/80 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                <span>100% Giấy phép Bộ Y Tế</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-teal-600 shrink-0" />
                <span>Giao nhanh 2H nội thành</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-teal-600 shrink-0" />
                <span>Bảo hành 1 đổi 1 24 tháng</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Showcase Ưu Đãi Nổi Bật Sàn TMĐT */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 relative transition-all duration-300 hover:shadow-2xl">
              {/* Badge ưu đãi */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  <Flame size={14} className="text-rose-600" />
                  ƯU ĐÃI NỔI BẬT TRONG THÁNG
                </span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/80">
                  GIẢM ĐẾN 30%
                </span>
              </div>

              {/* Sản phẩm tâm điểm */}
              <div className="space-y-4">
                <div className="relative rounded-2xl bg-gradient-to-br from-teal-50 to-slate-100 p-6 flex items-center justify-center overflow-hidden min-h-[180px]">
                  <Watch size={84} className="text-teal-600 transform hover:scale-110 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-xs">
                    WONLEX V3.2 PRO
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    Đồng Hồ Định Vị &amp; Cảnh Báo Té Ngã SOS Cho Người Cao Tuổi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Tích hợp cảm biến gia tốc nhận diện ngã, đo nhịp tim, huyết áp chuẩn y khoa và gọi khẩn cấp 1 chạm.
                  </p>
                </div>

                <div className="bg-teal-50/60 rounded-xl p-3 border border-teal-100 text-xs text-teal-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-teal-800">
                    <CheckCircle2 size={14} className="text-teal-600" /> Tặng kèm gói SIM 4G Viettel 12 tháng
                  </div>
                  <div className="font-semibold flex items-center gap-1.5 text-teal-800">
                    <CheckCircle2 size={14} className="text-teal-600" /> Miễn phí kết nối Dashboard Sức Khỏe trọn đời
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-2xl font-black text-rose-600">2.490.000 đ</span>
                    <span className="text-xs text-slate-400 line-through ml-2">3.550.000 đ</span>
                  </div>

                  <Link
                    href="/shop/products"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors"
                  >
                    Xem Chi Tiết
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CẦU NỐI HỆ SINH THÁI: Giới thiệu riêng Dashboard Giám Sát Sức Khỏe */}
      <section className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white py-8 border-y border-teal-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0 shadow-inner">
                <Activity size={26} className="animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  PHÂN HỆ THEO DÕI SỨC KHỎE RIÊNG BIỆT
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Bạn đang sở hữu thiết bị CareNest hoặc cần theo dõi người thân từ xa?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Truy cập <strong>Dashboard Sức Khỏe</strong> chuyên biệt để xem biểu đồ nhịp tim, huyết áp thời gian thực,
                  thiết lập vùng an toàn GPS và nhận cảnh báo khẩn cấp SOS độc lập.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/health/dashboard"
                id="banner-to-health-dashboard"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-900 bg-teal-400 hover:bg-teal-300 shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
              >
                <Activity size={18} className="text-slate-900" />
                Mở Dashboard Sức Khỏe
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Danh Mục Thiết Bị Tuyển Chọn (Visual Categories Grid) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Danh Mục Y Khoa
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
              Thiết Bị Y Tế &amp; Chăm Sóc Sức Khỏe Gia Đình
            </h2>
            <p className="text-slate-500 text-sm">
              Chọn nhóm thiết bị phù hợp với nhu cầu chẩn đoán và theo dõi sức khỏe cho người cao tuổi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visualCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href={`/shop/products?search=${encodeURIComponent(cat.search)}`}
                  className="group bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-teal-300 p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex items-start gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cat.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                      {cat.badge}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {cat.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-teal-600 mt-3">
                      <span>Xem sản phẩm</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. FLASH SALE & SẢN PHẨM BÁN CHẠY (Hot Deals Section) */}
      <section className="py-16 bg-slate-50/80 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Flash Sale với Đồng Hồ Đếm Ngược */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 mb-2">
                <Flame size={14} className="text-rose-600" />
                FLASH SALE HÔM NAY
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thiết Bị Y Tế Giá Ưu Đãi Đặc Biệt
              </h2>
            </div>

            {/* Đồng hồ đếm ngược */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Kết thúc sau:</span>
              <div className="flex items-center gap-1 font-mono text-xs font-bold">
                <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-slate-500 font-bold">:</span>
                <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-slate-500 font-bold">:</span>
                <span className="bg-rose-600 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Grid sản phẩm thật từ API */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <Skeleton className="h-44 w-full mb-4 rounded-xl" />
                  <Skeleton className="w-20 h-4 mb-2.5" />
                  <Skeleton className="w-4/5 h-5 mb-2" />
                  <Skeleton className="w-full h-3 mb-4" />
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Skeleton className="w-24 h-6" />
                    <Skeleton className="w-16 h-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const imageUrl = product.images?.[0]?.url;
                const badgeLabel = product.isIotDevice
                  ? 'IoT Sinh Tồn'
                  : product.category?.name || (product.isMedical ? 'Thiết Bị Y Tế' : 'Chính Hãng');
                const isAdded = addedIds.has(product.id);
                const isAdding = addingId === product.id;

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-teal-300 p-4 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col relative"
                  >
                    {/* Badge giảm giá góc */}
                    <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                      -20%
                    </div>

                    {/* Ảnh sản phẩm */}
                    <Link
                      href={`/shop/products/${product.id}`}
                      className="h-44 rounded-xl bg-slate-50 flex items-center justify-center text-teal-600 mb-3.5 overflow-hidden relative cursor-pointer"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : product.isIotDevice ? (
                        <Watch size={54} className="text-teal-600" />
                      ) : (
                        <Package size={54} className="text-teal-600" />
                      )}
                    </Link>

                    {/* Tag thể loại */}
                    <span className="self-start mb-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {badgeLabel}
                    </span>

                    {/* Tên sản phẩm */}
                    <Link
                      href={`/shop/products/${product.id}`}
                      className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-1.5"
                    >
                      {product.name}
                    </Link>

                    {/* Đánh giá sao uy tín */}
                    <div className="flex items-center gap-1 text-xs text-amber-500 mb-2.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium ml-1">4.9 (180+ đã mua)</span>
                    </div>

                    {/* Giá & Nút mua hàng */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-extrabold text-teal-700 leading-none">
                          {formatVnd(product.basePrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 line-through mt-0.5">
                          {formatVnd(Math.round(product.basePrice * 1.25))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickAddToCart(product)}
                        disabled={isAdding}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200'
                        }`}
                        title="Thêm nhanh vào giỏ hàng"
                      >
                        {isAdding ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isAdded ? (
                          <>
                            <Check size={14} />
                            <span>Đã thêm</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} />
                            <span>Mua</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center mb-4">
                <PackageOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa Có Sản Phẩm Mở Bán</h3>
              <p className="text-sm text-slate-500 mb-6">
                Danh mục thiết bị y tế đang được đồng bộ và cập nhật từ nhà cung cấp đã kiểm định.
              </p>
              <Link
                href="/shop/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all"
              >
                Khám Phá Cửa Hàng
              </Link>
            </div>
          )}

          {/* Nút xem toàn bộ gian hàng */}
          <div className="text-center mt-12">
            <Link
              href="/shop/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all"
            >
              Xem Toàn Bộ {products.length > 0 ? `${products.length}+ ` : ''}Sản Phẩm Y Tế
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. Section Quy Trình 3 Bước: Mua Sắm & Tích Hợp IoT Dễ Dàng */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Hệ Thống Khép Kín
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
              Từ Mua Sắm Đến Chăm Sóc Sức Khỏe Gia Đình
            </h2>
            <p className="text-slate-500 text-sm">
              Sở hữu thiết bị y tế chính hãng và kết nối bảo vệ người thân chỉ với 3 thao tác đơn giản.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bước 1 */}
            <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-xs">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                1. Đặt Mua Thiết Bị Y Tế
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lựa chọn máy đo huyết áp, máy tạo oxy hoặc đồng hồ Wonlex trên sàn TMĐT CareNest với cam kết 100% chuẩn y khoa.
              </p>
            </div>

            {/* Bước 2 */}
            <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-xs">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                2. Nhận Hàng &amp; Kích Hoạt Nhanh
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhận hàng hỏa tốc trong 2h. Nhập mã kích hoạt 8 ký tự kèm theo kiện hàng để liên kết thiết bị vào tài khoản.
              </p>
            </div>

            {/* Bước 3 */}
            <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-teal-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-xs">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                3. Giám Sát Trên Dashboard Riêng
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mở phân hệ Dashboard Sức Khỏe để theo dõi nhịp tim, huyết áp thời gian thực, thiết lập vùng an toàn GPS và nhận cảnh báo SOS.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
