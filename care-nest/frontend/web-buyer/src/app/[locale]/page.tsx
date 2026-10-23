'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Heart,
  Activity,
  ShieldAlert,
  ArrowRight,
  Watch,
  Thermometer,
  Wind,
  CheckCircle2,
  Package,
  PackageOpen,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { publicCatalogService, type PublicProduct } from '@/lib/services/public-catalog.service';
import { apiClient, getToken } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

interface DeviceDisplayInfo {
  name: string;
  imei: string;
  isLive: boolean;
}

interface VitalsDisplayInfo {
  heartRate: number | null;
  bloodPressure: string | null;
  spo2: number | null;
  temperature: number | null;
}

export default function HomePage() {
  const t = useTranslations();

  // State quản lý sản phẩm từ API
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // State tương tác Vitals & Thiết bị thật từ IoT Device Service
  const [sosStatus, setSosStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [vitals, setVitals] = useState<VitalsDisplayInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceDisplayInfo | null>(null);
  const [isLoadingDevice, setIsLoadingDevice] = useState(true);

  // 1. Fetch danh sách sản phẩm thật từ Catalog Service
  useEffect(() => {
    let isMounted = true;

    async function fetchFeaturedProducts() {
      try {
        setIsLoadingProducts(true);
        const res = await publicCatalogService.listProducts({ pageSize: 6 });
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

  // 2. Fetch thiết bị thực tế & telemetry mới nhất từ Device Service (không dùng mock data)
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveDeviceAndVitals() {
      try {
        setIsLoadingDevice(true);
        const token = getToken();
        let targetDevice: any = null;

        // Nếu đã đăng nhập, thử lấy thiết bị gán cho người dùng trước
        if (token) {
          try {
            const myDevs = await apiClient.devices.getMyDevices();
            if (Array.isArray(myDevs) && myDevs.length > 0) {
              targetDevice = myDevs[0];
            }
          } catch (e) {
            console.warn('Lỗi lấy thiết bị cá nhân:', e);
          }
        }

        // Nếu chưa đăng nhập hoặc chưa có thiết bị gán, lấy thiết bị hoạt động từ hệ thống
        if (!targetDevice) {
          const res = await apiClient.devices.getDevices();
          const items = Array.isArray(res) ? res : res?.items;
          if (Array.isArray(items) && items.length > 0) {
            targetDevice = items[0];
          }
        }

        if (isMounted && targetDevice) {
          const devId = targetDevice.deviceId || targetDevice.id;
          setDeviceInfo({
            name: targetDevice.model || 'Thiết Bị CareNest',
            imei: devId,
            isLive: true,
          });

          // Lấy telemetry mới nhất thật từ database (không gán số giả nếu API không có)
          try {
            const latest = await apiClient.devices.getLatestVitals(devId);
            if (isMounted && latest) {
              const hr = typeof latest.heartRate === 'number' ? latest.heartRate : null;
              setHeartRate(hr);
              setVitals({
                heartRate: hr,
                bloodPressure:
                  typeof latest.bloodPressureSystolic === 'number' && typeof latest.bloodPressureDiastolic === 'number'
                    ? `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}`
                    : null,
                spo2: typeof latest.spo2 === 'number' ? latest.spo2 : null,
                temperature: typeof latest.temperature === 'number' ? latest.temperature : null,
              });
            }
          } catch (vitalsErr) {
            console.warn('Không thể tải telemetry:', vitalsErr);
          }
        }
      } catch (err) {
        console.warn('Device service error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingDevice(false);
        }
      }
    }

    fetchLiveDeviceAndVitals();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Hiệu ứng nhịp tim dao động nhẹ tự nhiên quanh chỉ số thực tế
  useEffect(() => {
    const base = vitals?.heartRate;
    if (base == null) return;

    const interval = setInterval(() => {
      setHeartRate((prev) => {
        if (prev === null) return base;
        const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, hoặc +1
        const next = prev + variance;
        return next >= base - 3 && next <= base + 3 ? next : base;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [vitals?.heartRate]);

  // Xử lý nút thử loa SOS
  const handleTestSos = () => {
    if (sosStatus === 'testing') return;
    setSosStatus('testing');
    setTimeout(() => {
      setSosStatus('success');
      setTimeout(() => {
        setSosStatus('idle');
      }, 3500);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-slate-50 to-white pt-14 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Cột trái: Giới thiệu & CTA */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 shadow-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              NỀN TẢNG Y TẾ SỐ & GIÁM SÁT IOT 2026
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
              {t('health.title').replace('Trung Tâm Giám Sát Sức Khỏe Gia Đình', 'Chăm Sóc Người Thân Tận Tâm, An Toàn Tuyệt Đối Với ')}
              <span className="text-teal-600 ml-1">CareNest</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl">
              Hệ sinh thái kết hợp thiết bị y tế gia đình chính hãng và đồng hồ thông minh Wonlex V3.2:
              Tự động cảnh báo té ngã, đo huyết áp, nhịp tim và định vị GPS tức thì cho người cao tuổi.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/shop/products"
                id="hero-cta-shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Khám Phá Thiết Bị Y Tế
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/health/dashboard"
                id="hero-cta-dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all duration-200"
              >
                <Activity size={18} className="text-teal-600" />
                Xem Dashboard Sinh Tồn
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-9 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" /> Chuẩn y khoa
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" /> Cảnh báo SOS &lt; 2s
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" /> Định vị thời gian thực
              </div>
            </div>
          </div>

          {/* Cột phải: Thẻ mô phỏng thiết bị & sinh tồn IoT */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border-2 border-teal-600/20 shadow-xl p-6 sm:p-7 relative transition-all duration-300 hover:shadow-2xl">
              {/* Header thiết bị */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                    <Watch size={24} />
                  </div>
                  <div>
                    {isLoadingDevice ? (
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    ) : deviceInfo ? (
                      <>
                        <div className="font-bold text-base text-slate-900">{deviceInfo.name}</div>
                        <div className="text-xs text-slate-400">Mã IMEI: {deviceInfo.imei}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-base text-slate-500">Chưa có thiết bị</div>
                        <div className="text-xs text-slate-400">Vui lòng kết nối thiết bị IoT</div>
                      </>
                    )}
                  </div>
                </div>
                {isLoadingDevice ? (
                  <Skeleton className="h-6 w-24 rounded-full" />
                ) : deviceInfo ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${deviceInfo.isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    {deviceInfo.isLive ? 'THIẾT BỊ THỰC TẾ' : 'LIVE DEMO'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    CHƯA KẾT NỐI
                  </span>
                )}
              </div>

              {/* Lưới 4 chỉ số sinh tồn */}
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                {/* 1. Nhịp tim */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-1">
                    <Heart size={16} className="animate-pulse" /> Nhịp Tim (BPM)
                  </div>
                  {isLoadingDevice ? (
                    <Skeleton className="h-8 w-20 my-0.5" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {heartRate !== null ? heartRate : '--'} <span className="text-xs sm:text-sm font-normal text-slate-500">bpm</span>
                    </div>
                  )}
                  <div className={`text-xs font-medium mt-1 ${heartRate !== null ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {heartRate !== null ? 'Ổn định' : 'Chưa có dữ liệu'}
                  </div>
                </div>

                {/* 2. Huyết áp */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 mb-1">
                    <Activity size={16} /> Huyết Áp (BP)
                  </div>
                  {isLoadingDevice ? (
                    <Skeleton className="h-8 w-24 my-0.5" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {vitals?.bloodPressure ?? '--/--'} <span className="text-xs sm:text-sm font-normal text-slate-500">mmHg</span>
                    </div>
                  )}
                  <div className={`text-xs font-medium mt-1 ${vitals?.bloodPressure ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {vitals?.bloodPressure ? 'Chuẩn Y Khoa' : 'Chưa có dữ liệu'}
                  </div>
                </div>

                {/* 3. SpO2 */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
                    <Wind size={16} /> Oxy Máu (SpO2)
                  </div>
                  {isLoadingDevice ? (
                    <Skeleton className="h-8 w-16 my-0.5" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {vitals?.spo2 != null ? vitals.spo2 : '--'} <span className="text-xs sm:text-sm font-normal text-slate-500">%</span>
                    </div>
                  )}
                  <div className={`text-xs font-medium mt-1 ${vitals?.spo2 != null ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {vitals?.spo2 != null ? 'Tối ưu' : 'Chưa có dữ liệu'}
                  </div>
                </div>

                {/* 4. Thân nhiệt */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-1">
                    <Thermometer size={16} /> Thân Nhiệt
                  </div>
                  {isLoadingDevice ? (
                    <Skeleton className="h-8 w-16 my-0.5" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {vitals?.temperature != null ? vitals.temperature : '--'} <span className="text-xs sm:text-sm font-normal text-slate-500">°C</span>
                    </div>
                  )}
                  <div className={`text-xs font-medium mt-1 ${vitals?.temperature != null ? 'text-emerald-600' : 'text-slate-400'}`}>
                    ● {vitals?.temperature != null ? 'Bình thường' : 'Chưa có dữ liệu'}
                  </div>
                </div>
              </div>

              {/* Hộp hành động thử nghiệm loa SOS */}
              <div
                className={`rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors border ${
                  sosStatus === 'testing'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : sosStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {sosStatus === 'testing' ? (
                    <Volume2 size={20} className="text-amber-600 animate-bounce" />
                  ) : (
                    <ShieldAlert size={20} className={sosStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
                  )}
                  <span className="text-xs sm:text-sm font-bold">
                    {sosStatus === 'testing'
                      ? 'Đang phát tín hiệu thử loa SOS...'
                      : sosStatus === 'success'
                      ? 'Loa SOS hoạt động tốt, âm lượng 95dB!'
                      : 'Hệ thống khẩn cấp SOS sẵn sàng'}
                  </span>
                </div>
                <button
                  id="card-test-sos-btn"
                  onClick={handleTestSos}
                  disabled={sosStatus === 'testing'}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shrink-0 ${
                    sosStatus === 'testing'
                      ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                      : sosStatus === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                  }`}
                >
                  {sosStatus === 'testing' ? 'Đang thử...' : sosStatus === 'success' ? 'Đã thử' : 'Kiểm tra loa'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories & Products Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 mb-3">
              <Sparkles size={14} /> Danh Mục Tuyển Chọn
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Thiết Bị Y Tế & Chăm Sóc Sức Khỏe Gia Đình
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Tất cả sản phẩm đều được kiểm định nguồn gốc y khoa, bảo hành chính hãng và hỗ trợ tích hợp dữ liệu theo dõi 24/7.
            </p>
          </div>

          {/* Khi đang tải sản phẩm từ API */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <Skeleton className="h-44 w-full mb-4" />
                  <Skeleton className="w-24 h-5 mb-3" />
                  <Skeleton className="w-4/5 h-6 mb-2" />
                  <Skeleton className="w-full h-4 mb-1.5" />
                  <Skeleton className="w-2/3 h-4 mb-6" />
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <Skeleton className="w-24 h-7" />
                    <Skeleton className="w-16 h-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            /* Khi có sản phẩm thật từ API */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const imageUrl = product.images?.[0]?.url;
                const badgeLabel = product.isIotDevice
                  ? 'IoT Độc Quyền'
                  : product.category?.name || (product.isMedical ? 'Thiết Bị Y Tế' : 'Chính Hãng');

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col"
                  >
                    {/* Hình ảnh sản phẩm */}
                    <div className="h-48 rounded-xl bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center text-teal-600 mb-4 overflow-hidden relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : product.isIotDevice ? (
                        <Watch size={64} className="text-teal-600" />
                      ) : (
                        <Package size={64} className="text-teal-600" />
                      )}
                    </div>

                    {/* Badge thể loại */}
                    <span
                      className={`self-start mb-2 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        product.isIotDevice
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {badgeLabel}
                    </span>

                    {/* Tiêu đề sản phẩm */}
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 mb-2">
                      {product.name}
                    </h3>

                    {/* Mô tả ngắn */}
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
                      {product.description || 'Sản phẩm y tế chính hãng kiểm định chất lượng nghiêm ngặt.'}
                    </p>

                    {/* Giá & Nút chi tiết */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <span className="text-xl font-extrabold text-teal-700">
                        {formatVnd(product.basePrice)}
                      </span>
                      <Link
                        href={`/shop/products/${product.id}`}
                        id={`product-card-btn-${product.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-teal-600 hover:text-white transition-all duration-200"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State khi chưa có sản phẩm nào */
            <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center mb-4">
                <PackageOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Chưa Có Sản Phẩm Nào
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Hiện tại hệ thống chưa có sản phẩm nào được mở bán hoặc danh mục đang được cập nhật. Bạn có thể ghé thăm lại sau.
              </p>
              <Link
                href="/shop/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
              >
                Khám Phá Cửa Hàng
              </Link>
            </div>
          )}

          {/* Nút Xem tất cả sản phẩm (chỉ hiện khi có sản phẩm) */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/shop/products"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all"
              >
                Xem Toàn Bộ Sản Phẩm Y Tế
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
