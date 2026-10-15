'use client';

import { Wifi, Battery } from 'lucide-react';

interface DeviceStatusBarProps {
  imei?: string;
  model?: string;
  battery?: number;
  isConnected?: boolean;
  lastUpdated?: string;
  inGeofence?: string;
}

export function DeviceStatusBar({
  imei,
  model,
  battery,
  isConnected = false,
  lastUpdated,
  inGeofence,
}: DeviceStatusBarProps) {
  const batteryColor = battery == null
    ? 'var(--text-muted)'
    : battery > 50
    ? 'var(--success)'
    : battery > 20
    ? 'var(--accent)'
    : 'var(--danger)';

  return (
    <div className="card" style={{
      padding: '16px 24px',
      marginBottom: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      background: '#ffffff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className={`badge ${isConnected ? 'badge-green' : 'badge-red'}`}>
          <Wifi size={14} /> {isConnected ? '4G LTE Kết Nối Mạnh' : 'Mất kết nối'}
        </span>
        {imei && (
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            IMEI: <strong>{imei}</strong>
          </span>
        )}
        {model && (
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {model}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {battery != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Battery size={18} color={batteryColor} />
            <span>
              Pin: <strong>{battery}%</strong>
              {battery > 50 ? ' (Tốt)' : battery > 20 ? ' (Thấp)' : ' (Sạc ngay)'}
            </span>
          </div>
        )}
        {lastUpdated && (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Cập nhật lúc: <strong>{lastUpdated}</strong>
          </div>
        )}
        {inGeofence && (
          <span className="badge badge-green">
            ✓ {inGeofence}
          </span>
        )}
      </div>
    </div>
  );
}
