'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { VitalsGrid } from '@/components/health/vitals-grid';
import { AlertsList } from '@/components/health/alerts-list';
import { DeviceStatusBar } from '@/components/health/device-status-bar';
import { useRealtimeVitals } from '@/lib/hooks/use-realtime-vitals';
import { useAlerts } from '@/lib/hooks/use-alerts';
import { VitalsCardSkeleton, AlertSkeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const t = useTranslations('health');
  const [deviceId] = useState<string>('device-001'); // Would come from auth/user context
  const [userId] = useState<string>('user-001');

  // Simulated initial data (from SSR)
  const [initialVitals] = useState({
    deviceId: 'device-001',
    timestamp: new Date().toISOString(),
    heartRate: 72,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 78,
    spo2: 98,
    temperature: 36.7,
    battery: 84,
    lat: 10.7769,
    lng: 106.7009,
    inGeofence: 'Nhà riêng',
  });

  const { vitals, isConnected } = useRealtimeVitals({
    deviceId,
    userId,
    initialVitals,
  });

  const [alerts] = useState([
    {
      id: '1',
      severity: 'LOW' as const,
      kind: 'PERIODIC',
      message: 'Đo huyết áp định kỳ tự động',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      acknowledged: false,
    },
    {
      id: '2',
      severity: 'LOW' as const,
      kind: 'GPS_UPDATE',
      message: 'Cập nhật vị trí GPS thành công',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      acknowledged: true,
    },
    {
      id: '3',
      severity: 'HIGH' as const,
      kind: 'SOS_TEST',
      message: 'Kiểm tra đường truyền khẩn cấp SOS',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      acknowledged: true,
    },
  ]);

  const vitalsData = vitals ? {
    heartRate: vitals.heartRate,
    bloodPressureSystolic: vitals.bloodPressureSystolic,
    bloodPressureDiastolic: vitals.bloodPressureDiastolic,
    spo2: vitals.spo2,
    temperature: vitals.temperature,
  } : null;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-teal" style={{ marginBottom: '8px' }}>
            <span className="pulse-dot" style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
              display: 'inline-block',
            }}></span>
            {t('realtime')}
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            {t('subtitle')}: <strong>Cụ Nguyễn Văn An (82 tuổi)</strong> — Thiết bị Wonlex KT24S
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button id="dashboard-refresh-btn" className="btn btn-secondary">
            <RefreshCw size={16} /> {t('refresh')}
          </button>
          <button id="dashboard-sos-call-btn" className="btn btn-danger">
            <ShieldAlert size={16} /> {t('sosCall')}
          </button>
        </div>
      </div>

      {/* Device Status Bar */}
      <DeviceStatusBar
        imei="864502049182315"
        model="Wonlex KT24S"
        battery={vitals?.battery ?? initialVitals.battery}
        isConnected={isConnected}
        lastUpdated={t('justNow')}
        inGeofence={vitals?.inGeofence ?? initialVitals.inGeofence}
      />

      {/* Vitals Grid */}
      <VitalsGrid vitals={vitalsData} />

      {/* Alerts + GPS Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Alerts Feed */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
              <RefreshCw size={20} color="var(--primary)" /> {t('alerts.title')}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('alerts.today')}</span>
          </div>
          <AlertsList alerts={alerts} />
        </div>

        {/* GPS Map Placeholder */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
              <span style={{ color: 'var(--primary)' }}>📍</span> {t('device.location')}
            </div>
            <span className="badge badge-green">Vùng an toàn (Nhà)</span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <span style={{ fontSize: '40px' }}>📍</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>
                Số 12A, Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh
              </div>
              <div style={{ fontSize: '13px' }}>
                Tọa độ: {(vitals?.lat ?? 10.7769).toFixed(4)}° N, {(vitals?.lng ?? 106.7009).toFixed(4)}° E
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
