'use client';

import { Bell } from 'lucide-react';
import { AlertSkeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kind: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading?: boolean;
}

function formatAlertTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function AlertsList({ alerts, isLoading }: AlertsListProps) {
  const t = useTranslations('health.alerts');

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

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
            alert.acknowledged
              ? 'bg-slate-50/70 border-slate-200 text-slate-600 opacity-75'
              : 'bg-rose-50/50 border-rose-200 text-slate-900 shadow-xs'
          }`}
        >
          <div className="relative mt-1 flex h-2.5 w-2.5 flex-shrink-0">
            {!alert.acknowledged && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-500'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-500'
                  : alert.severity === 'MEDIUM'
                  ? 'bg-indigo-500'
                  : 'bg-emerald-500'
              }`}></span>
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              alert.severity === 'CRITICAL'
                ? 'bg-rose-600'
                : alert.severity === 'HIGH'
                ? 'bg-amber-500'
                : alert.severity === 'MEDIUM'
                ? 'bg-indigo-500'
                : 'bg-emerald-500'
            }`}></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-snug">
              {alert.message}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{formatAlertTime(alert.timestamp)}</span>
              <span>•</span>
              <span className="font-medium text-slate-600">{t(`severity.${alert.severity}`)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
