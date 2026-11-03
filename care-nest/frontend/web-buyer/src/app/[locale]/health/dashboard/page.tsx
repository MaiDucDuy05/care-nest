'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, RefreshCw, MapPin, Watch, Users, CheckCircle, ChevronDown, HeartHandshake } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { VitalsGrid } from '@/components/health/vitals-grid';
import { AlertsList } from '@/components/health/alerts-list';
import { DeviceStatusBar } from '@/components/health/device-status-bar';
import { useRealtimeVitals } from '@/lib/hooks/use-realtime-vitals';
import { devicesService } from '@/services/devices.service';
import { alertsService } from '@/services/alerts.service';
import { caregiversService } from '@/services/caregivers.service';
import { authService } from '@/services/auth.service';
import { getToken } from '@/lib/api-client';
import dynamic from 'next/dynamic';

const LiveDeviceMap = dynamic(
  () => import('@/components/health/live-device-map').then((m) => m.LiveDeviceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200">
        <RefreshCw size={22} className="animate-spin text-teal-600" />
        <span className="text-xs font-medium">Đang tải bản đồ GPS...</span>
      </div>
    ),
  }
);

interface SelectableDevice {
  id: string;
  imei: string;
  name: string;
  isOwner: boolean;
  patientName?: string;
  patientPhone?: string;
  relationship?: string;
  permissions?: {
    viewHealth: boolean;
    receiveAlerts: boolean;
    manageDevices: boolean;
  };
}

export default function DashboardPage() {
  const t = useTranslations('health');
  const router = useRouter();

  const [availableDevices, setAvailableDevices] = useState<SelectableDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const [initialVitals, setInitialVitals] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Active selected device metadata
  const currentDevice = useMemo(() => {
    return availableDevices.find((d) => d.id === selectedDeviceId) || availableDevices[0] || null;
  }, [availableDevices, selectedDeviceId]);

  const loadVitalsForDevice = useCallback(async (devId: string) => {
    if (!devId) return;
    try {
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
    } catch (e) {
      console.warn('Failed to load vitals for device:', devId, e);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    const token = getToken();

    // Bắt buộc phải đăng nhập
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

      // 2. Lấy thiết bị của chính mình + thiết bị được chia sẻ qua quyền Caregiver
      const [myDevices, patientGroups] = await Promise.all([
        devicesService.getMyDevices().catch(() => []),
        caregiversService.getPatients().catch(() => []),
      ]);

      const deviceList: SelectableDevice[] = [];

      // Thiết bị do chính user sở hữu
      if (Array.isArray(myDevices)) {
        for (const d of myDevices) {
          const devId = d.deviceId || d.id;
          if (devId) {
            deviceList.push({
              id: devId,
              imei: d.imei || devId,
              name: d.model || 'Thiết Bị Của Tôi',
              isOwner: true,
              patientName: 'Chính tôi',
            });
          }
        }
      }

      // Thiết bị của người thân / bệnh nhân ủy quyền cho user làm Caregiver
      if (Array.isArray(patientGroups)) {
        for (const p of patientGroups) {
          for (const d of p.devices || []) {
            const devId = d.deviceId || d.id;
            if (devId && !deviceList.some((item) => item.id === devId)) {
              deviceList.push({
                id: devId,
                imei: d.imei || devId,
                name: d.model || 'Thiết Bị Giám Sát',
                isOwner: false,
                patientName: p.fullName || p.email,
                patientPhone: p.phone,
                relationship: p.relationship,
                permissions: p.permissions,
              });
            }
          }
        }
      }

      setAvailableDevices(deviceList);

      // Quyết định thiết bị đang chọn
      let activeId = selectedDeviceId;
      if (!activeId || !deviceList.some((d) => d.id === activeId)) {
        activeId = deviceList[0]?.id || '';
        setSelectedDeviceId(activeId);
      }

      // 3. Lấy telemetry sinh tồn của thiết bị đang chọn
      if (activeId) {
        await loadVitalsForDevice(activeId);
      } else {
        setInitialVitals(null);
      }

      // 4. Lấy cảnh báo
      const alertsRes = await alertsService.listAlerts({ limit: 10 }).catch(() => null);
      if (alertsRes?.items && Array.isArray(alertsRes.items)) {
        setAlerts(alertsRes.items);
      } else if (Array.isArray(alertsRes)) {
        setAlerts(alertsRes);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [router, selectedDeviceId, loadVitalsForDevice]);

  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    setIsRefreshing(true);
    await loadVitalsForDevice(newDeviceId);
    setIsRefreshing(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertsService.updateStatus(alertId, 'ACKNOWLEDGED');
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged: true } : a))
      );
    } catch (err) {
      console.warn('Failed to acknowledge alert:', err);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged: true } : a))
      );
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const token = getToken();
  const effectiveDeviceId = currentDevice?.id || '';
  const { vitals, isConnected } = useRealtimeVitals({
    deviceId: effectiveDeviceId,
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

  // Nếu chưa đăng nhập
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
        
        {/* Patient / Device Switcher Bar (Caregiver View) */}
        {availableDevices.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                currentDevice?.isOwner ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {currentDevice?.isOwner ? <Watch size={20} /> : <HeartHandshake size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {currentDevice?.isOwner ? 'Thiết bị của bạn' : 'Chế độ Người Chăm Sóc (Caregiver)'}
                  </span>
                  {!currentDevice?.isOwner && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <CheckCircle size={10} /> Đã ủy quyền
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  {currentDevice?.isOwner ? (
                    'Theo dõi sinh hiệu cá nhân'
                  ) : (
                    <>Đang theo dõi: <span className="text-indigo-600">{currentDevice?.patientName}</span> ({currentDevice?.relationship === 'DOCTOR' ? 'Bác sĩ' : currentDevice?.relationship === 'NURSE' ? 'Điều dưỡng' : 'Gia đình'})</>
                  )}
                </div>
              </div>
            </div>

            {/* Selector Dropdown if multiple devices / patients exist */}
            {availableDevices.length > 1 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="device-selector" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Chuyển người theo dõi:
                </label>
                <div className="relative flex-1 sm:w-64">
                  <select
                    id="device-selector"
                    value={effectiveDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-all"
                  >
                    {availableDevices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.isOwner
                          ? `[Của tôi] ${d.name}`
                          : `[${d.patientName}] ${d.name} (${d.relationship || 'Người thân'})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

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
              {currentDevice ? (
                <>
                  Thiết bị: <strong className="font-semibold text-slate-800">{currentDevice.name}</strong> (IMEI: <span className="font-mono text-slate-600">{currentDevice.imei}</span>)
                  {!currentDevice.isOwner && (
                    <> — Người thân: <strong className="text-indigo-600 font-semibold">{currentDevice.patientName}</strong></>
                  )}
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
            <Link
              href="/health/caregivers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-xs transition-all"
            >
              <Users size={16} /> Mời Người Chăm Sóc
            </Link>
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

        {/* Banner nếu chưa có thiết bị nào */}
        {availableDevices.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Watch size={20} />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900">Tài khoản của bạn chưa có thiết bị giám sát nào</div>
                <div className="text-xs text-amber-700 mt-0.5">Vui lòng kích hoạt thiết bị IoT mới hoặc nhờ người thân gửi lời mời theo dõi sức khỏe.</div>
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
          imei={currentDevice?.imei ?? '--'}
          model={currentDevice ? (currentDevice.isOwner ? currentDevice.name : `${currentDevice.name} (${currentDevice.patientName})`) : 'Thiết bị'}
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
            <AlertsList alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
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
                {vitals?.inGeofence || 'Vùng an toàn (Nhà)'}
              </span>
            </div>

            <LiveDeviceMap
              lat={vitals?.lat ?? initialVitals?.lat ?? 21.0381}
              lng={vitals?.lng ?? initialVitals?.lng ?? 105.8234}
              deviceName={currentDevice?.name ?? 'Thiết Bị CareNest'}
              locationName={vitals?.inGeofence || 'Nhà riêng'}
              inGeofence={vitals?.inGeofence ?? initialVitals?.inGeofence ?? 'Vùng an toàn (Nhà)'}
              isConnected={isConnected}
              height="280px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
