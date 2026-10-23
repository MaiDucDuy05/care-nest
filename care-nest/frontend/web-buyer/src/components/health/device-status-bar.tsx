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
  const batteryColorClass = battery == null
    ? 'text-slate-400'
    : battery > 50
    ? 'text-emerald-500'
    : battery > 20
    ? 'text-amber-500'
    : 'text-rose-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          <Wifi size={14} /> {isConnected ? '4G LTE Kết Nối Mạnh' : 'Mất kết nối'}
        </span>
        {imei && (
          <span className="text-slate-500">
            IMEI: <strong className="text-slate-700 font-mono">{imei}</strong>
          </span>
        )}
        {model && (
          <span className="text-slate-600 font-medium">
            {model}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
        {battery != null && (
          <div className="flex items-center gap-2">
            <Battery size={18} className={batteryColorClass} />
            <span className="text-slate-600">
              Pin: <strong className="text-slate-800">{battery}%</strong>{' '}
              <span className="text-xs text-slate-400">
                {battery > 50 ? '(Tốt)' : battery > 20 ? '(Thấp)' : '(Sạc ngay)'}
              </span>
            </span>
          </div>
        )}
        {lastUpdated && (
          <div className="text-slate-500 text-xs sm:text-sm">
            Cập nhật: <strong className="text-slate-700">{lastUpdated}</strong>
          </div>
        )}
        {inGeofence && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ {inGeofence}
          </span>
        )}
      </div>
    </div>
  );
}
