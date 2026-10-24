'use client';

import { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { AlertSkeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type?: string;
  kind?: string;
  message?: string;
  detail?: string | null;
  notes?: string | null;
  timestamp?: string | Date;
  occurredAt?: string | Date;
  receivedAt?: string | Date;
  createdAt?: string | Date;
  acknowledged?: boolean;
  acknowledgedAt?: string | Date | null;
  status?: string;
  payload?: any;
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading?: boolean;
  onAcknowledge?: (alertId: string) => Promise<void> | void;
}

/**
 * Format timestamp safely without ever rendering "Invalid Date"
 */
export function formatAlertTime(rawDate?: string | Date | null): string {
  if (!rawDate) return 'Vừa xong';

  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return 'Vừa xong';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (isToday) {
    return `${timeStr} Hôm nay`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${timeStr}, ${day}/${month}`;
}

/**
 * Generate human-friendly title for alert based on type / code
 */
export function getAlertTitle(alert: Alert): string {
  if (alert.message && typeof alert.message === 'string' && alert.message.trim().length > 0) {
    return alert.message;
  }

  const code = (alert.type || alert.kind || '').toUpperCase();

  switch (code) {
    case 'SOS':
      return 'Phát hiện tín hiệu SOS khẩn cấp';
    case 'FALL':
      return 'Cảnh báo phát hiện té ngã';
    case 'VITALS_HR_HIGH':
      return 'Cảnh báo nhịp tim cao vượt ngưỡng';
    case 'VITALS_HR_LOW':
      return 'Cảnh báo nhịp tim quá thấp';
    case 'VITALS_BP_HIGH':
      return 'Cảnh báo huyết áp tăng cao';
    case 'VITALS_BP_LOW':
      return 'Cảnh báo huyết áp hạ thấp';
    case 'VITALS_OXYGEN_LOW':
      return 'Nồng độ oxy trong máu (SpO2) giảm thấp';
    case 'VITALS_TEMP_HIGH':
      return 'Cảnh báo nhiệt độ cơ thể cao (Sốt)';
    case 'VITALS_TEMP_LOW':
      return 'Cảnh báo hạ thân nhiệt';
    case 'GEOFENCE_EXIT':
      return 'Người thân rời khỏi vùng an toàn';
    case 'GEOFENCE_ENTER':
      return 'Người thân đã vào vùng an toàn';
    case 'LOW_BATTERY':
      return 'Pin thiết bị yếu';
    default:
      if (alert.payload?.reason) return String(alert.payload.reason);
      return 'Cảnh báo sức khỏe thiết bị';
  }
}

/**
 * Extract detail/notes from alert payload
 */
export function getAlertDetail(alert: Alert): string | null {
  if (alert.notes && typeof alert.notes === 'string' && alert.notes.trim().length > 0) {
    return alert.notes;
  }

  const payload = alert.payload;
  if (!payload || typeof payload !== 'object') return null;

  const code = (alert.type || alert.kind || '').toUpperCase();

  if (code === 'VITALS_HR_HIGH' || code === 'VITALS_HR_LOW') {
    if (payload.heartRate) {
      return `Nhịp tim ghi nhận: ${payload.heartRate} bpm${payload.threshold ? ` (Ngưỡng an toàn: ${payload.threshold} bpm)` : ''}`;
    }
  }

  if (code === 'VITALS_BP_HIGH' || code === 'VITALS_BP_LOW') {
    if (payload.systolic || payload.value) {
      return `Huyết áp: ${payload.systolic || payload.value}${payload.diastolic ? `/${payload.diastolic}` : ''} mmHg`;
    }
  }

  if (code === 'VITALS_OXYGEN_LOW') {
    if (payload.oxygen || payload.value) {
      return `Chỉ số SpO2: ${payload.oxygen || payload.value}% (Ngưỡng chuẩn ≥ 95%)`;
    }
  }

  if (code === 'LOW_BATTERY') {
    const batt = payload.batteryLevel ?? payload.battery;
    if (batt !== undefined) {
      return `Mức pin hiện tại còn ${batt}%. Vui lòng kết nối sạc sớm.`;
    }
  }

  if (code === 'GEOFENCE_EXIT') {
    if (payload.geofenceName) {
      return `Khu vực: ${payload.geofenceName}`;
    }
    if (payload.reason) return String(payload.reason);
  }

  if (code === 'FALL') {
    if (payload.fallVelocity || payload.impactGForce) {
      return `Lực va chạm: ${payload.impactGForce || 4.2}G, vận tốc rơi: ${payload.fallVelocity || 3.4} m/s`;
    }
  }

  if (payload.reason) return String(payload.reason);

  return null;
}

/**
 * Determine if alert is already acknowledged/resolved
 */
export function isAlertAcknowledged(alert: Alert): boolean {
  if (alert.acknowledged === true) return true;
  if (alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED' || alert.status === 'CLOSED_FALSE') return true;
  if (alert.acknowledgedAt) return true;
  return false;
}

export function AlertsList({ alerts, isLoading, onAcknowledge }: AlertsListProps) {
  const t = useTranslations('health.alerts');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <AlertSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <EmptyState
        icon={<Bell size={32} />}
        title={t('noAlerts')}
        description="Không có cảnh báo nào trong 24 giờ qua"
      />
    );
  }

  const handleAcknowledge = async (alertId: string) => {
    if (!onAcknowledge) return;
    setAcknowledgingId(alertId);
    try {
      await onAcknowledge(alertId);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const isAck = isAlertAcknowledged(alert);
        const title = getAlertTitle(alert);
        const detail = getAlertDetail(alert);
        const timeStr = formatAlertTime(alert.occurredAt || alert.receivedAt || alert.createdAt || alert.timestamp);
        const severity = alert.severity || 'LOW';

        return (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
              isAck
                ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                : severity === 'CRITICAL'
                ? 'bg-rose-50/60 border-rose-200/80 text-rose-950 shadow-xs'
                : severity === 'HIGH'
                ? 'bg-amber-50/60 border-amber-200/80 text-amber-950 shadow-xs'
                : severity === 'MEDIUM'
                ? 'bg-blue-50/60 border-blue-200/80 text-blue-950 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Dot indicator */}
              <div className="relative mt-1 flex h-2.5 w-2.5 flex-shrink-0">
                {!isAck && (
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                      severity === 'CRITICAL'
                        ? 'bg-rose-500'
                        : severity === 'HIGH'
                        ? 'bg-amber-500'
                        : severity === 'MEDIUM'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  ></span>
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    severity === 'CRITICAL'
                      ? 'bg-rose-600'
                      : severity === 'HIGH'
                      ? 'bg-amber-500'
                      : severity === 'MEDIUM'
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                  }`}
                ></span>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-snug text-slate-900">
                  {title}
                </div>

                {detail && (
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {detail}
                  </div>
                )}

                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-600">{timeStr}</span>
                  <span>•</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                      severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700'
                        : severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : severity === 'MEDIUM'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {t(`severity.${severity}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Acknowledge Action / Status */}
            <div className="flex-shrink-0 pt-0.5">
              {!isAck ? (
                onAcknowledge ? (
                  <button
                    type="button"
                    disabled={acknowledgingId === alert.id}
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {acknowledgingId === alert.id ? (
                      <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <CheckCircle2 size={13} className="text-slate-500" />
                    )}
                    <span>Xác nhận</span>
                  </button>
                ) : null
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Đã xử lý
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
