'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, RefreshCw, MapPin, Watch } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { VitalsGrid } from '@/components/health/vitals-grid';
import { AlertsList } from '@/components/health/alerts-list';
import { DeviceStatusBar } from '@/components/health/device-status-bar';
import { useRealtimeVitals } from '@/lib/hooks/use-realtime-vitals';
import { devicesService } from '@/services/devices.service';
import { alertsService } from '@/services/alerts.service';
import { authService } from '@/services/auth.service';
import { getToken } from '@/lib/api-client';

export default function DashboardPage() {
  const t = useTranslations('health');
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<{ name: string; imei: string; isReal: boolean } | null>(null);

  const [initialVitals, setInitialVitals] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    const token = getToken();

    // Bắt buộc phải đăng nhập mới xem được thiết bị của mình
    if (!token) {
      setIsAuthenticated(false);
      setIsAuthChecking(false);
      setIsRefreshing(false);
      router.replace('/auth/login');
      return;
    }

    try {
      // 1. Kiểm tra session và lấy profile người dùng
      const userRes = await authService.me().catch(() => null);
      if (!userRes?.user?.id) {
        setIsAuthenticated(false);
        setIsAuthChecking(false);
        router.replace('/auth/login');
        return;
      }

      setIsAuthenticated(true);
      setIsAuthChecking(false);
      setUserId(userRes.user.id);

      // 2. CHỈ lấy danh sách thiết bị được gán cho chính tài khoản người dùng này
      const myDevices = await devicesService.getMyDevices().catch(() => []);
      if (Array.isArray(myDevices) && myDevices.length > 0) {
        const primary = myDevices[0];
        const devId = primary.deviceId || primary.id;
        setDeviceId(devId);
        setDeviceInfo({
          name: primary.model || 'Thiết Bị CareNest',
          imei: devId,
          isReal: true,
        });

        // 3. Lấy telemetry sinh tồn mới nhất của thiết bị
        const latest = await devicesService.getLatestVitals(devId).catch(() => null);
        if (latest) {
          setInitialVitals({
            deviceId: devId,
            timestamp: latest.timestamp,
            heartRate: latest.heartRate,
            bloodPressureSystolic: latest.bloodPressureSystolic,
            bloodPressureDiastolic: latest.bloodPressureDiastolic,
            spo2: latest.spo2,
            temperature: latest.temperature,
            battery: latest.battery,
            lat: latest.lat,
            lng: latest.lng,
            inGeofence: latest.inGeofence,
          });
        }
      } else {
        // Tài khoản chưa được gán thiết bị nào
        setDeviceId('');
        setDeviceInfo(null);
        setInitialVitals(null);
      }

      // 4. Lấy cảnh báo thật của người dùng
      const alertsRes = await alertsService.listAlerts({ limit: 10 }).catch(() => null);
      if (alertsRes?.items && Array.isArray(alertsRes.items)) {
        setAlerts(alertsRes.items);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const token = getToken();
  const { vitals, isConnected } = useRealtimeVitals({
    deviceId,
    userId,
    authToken: token || undefined,
    initialVitals,
  });

  const currentVitals = vitals || initialVitals;
  const vitalsData = currentVitals ? {
    heartRate: currentVitals.heartRate,
    bloodPressureSystolic: currentVitals.bloodPressureSystolic,
    bloodPressureDiastolic: currentVitals.bloodPressureDiastolic,
    spo2: currentVitals.spo2,
    temperature: currentVitals.temperature,
  } : null;

  // Màn hình đang kiểm tra đăng nhập
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-3 shadow-xs">
          <RefreshCw size={22} className="animate-spin text-teal-600" />
        </div>
        <p className="text-sm font-medium text-slate-500">Đang kiểm tra thông tin đăng nhập...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập (đang chờ redirect hoặc chưa có token)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Yêu Cầu Đăng Nhập</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Bạn cần đăng nhập tài khoản để xem thông tin thiết bị và theo dõi chỉ số sinh tồn của người thân.
          </p>
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
          >
            Đăng Nhập Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-xs mb-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              {t('realtime')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {deviceInfo?.isReal ? (
                <>
                  Thiết bị giám sát: <strong className="font-semibold text-slate-800">{deviceInfo.name}</strong> (IMEI: <span className="font-mono text-slate-600">{deviceInfo.imei}</span>)
                </>
              ) : deviceInfo ? (
                <>
                  Thiết bị: <strong className="font-semibold text-slate-800">{deviceInfo.name}</strong> (IMEI: <span className="font-mono text-slate-600">{deviceInfo.imei}</span>)
                </>
              ) : (
                <>
                  Chưa kết nối thiết bị giám sát —{' '}
                  <Link href="/activation" className="text-teal-600 hover:text-teal-700 font-semibold underline underline-offset-2">
                    Kích hoạt thiết bị thật ngay
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="dashboard-refresh-btn"
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'} /> {t('refresh')}
            </button>
            <button
              id="dashboard-sos-call-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <ShieldAlert size={16} /> {t('sosCall')}
            </button>
          </div>
        </div>

        {/* Banner nếu chưa có thiết bị nào được gán */}
        {!deviceInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Watch size={20} />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900">Tài khoản của bạn chưa có thiết bị giám sát nào</div>
                <div className="text-xs text-amber-700 mt-0.5">Vui lòng kích hoạt thiết bị IoT mới để bắt đầu theo dõi sức khỏe và vị trí của người thân.</div>
              </div>
            </div>
            <Link
              href="/activation"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors whitespace-nowrap"
            >
              Kích Hoạt Thiết Bị Ngay
            </Link>
          </div>
        )}

        {/* Device Status Bar */}
        <DeviceStatusBar
          imei={deviceInfo?.imei ?? '--'}
          model={deviceInfo?.name ?? 'Thiết bị'}
          battery={vitals?.battery ?? initialVitals?.battery ?? 0}
          isConnected={isConnected}
          lastUpdated={t('justNow')}
          inGeofence={vitals?.inGeofence ?? initialVitals?.inGeofence ?? 'Chưa xác định'}
        />

        {/* Vitals Grid */}
        <VitalsGrid vitals={vitalsData} />

        {/* Alerts + GPS Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          {/* Alerts Feed */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <RefreshCw size={16} />
                </div>
                <span>{t('alerts.title')}</span>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                {t('alerts.today')}
              </span>
            </div>
            <AlertsList alerts={alerts} />
          </div>

          {/* GPS Map Box */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <span>{t('device.location')}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Vùng an toàn (Nhà)
              </span>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 rounded-xl border border-slate-200 p-6 min-h-[220px] flex flex-col items-center justify-center text-center shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-teal-600 mb-3 border border-teal-100/60">
                <MapPin size={28} className="text-teal-600 animate-bounce" />
              </div>
              <div className="max-w-sm">
                <div className="font-bold text-sm text-slate-800 leading-snug">
                  {vitals?.inGeofence || 'Số 12A, Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh'}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-2 bg-white/90 px-3.5 py-1.5 rounded-full border border-slate-200/80 inline-block shadow-xs">
                  Tọa độ: {(vitals?.lat ?? 21.0381).toFixed(4)}° N, {(vitals?.lng ?? 105.8234).toFixed(4)}° E
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
