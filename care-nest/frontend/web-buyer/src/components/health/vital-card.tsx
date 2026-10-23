'use client';

import { useTranslations } from 'next-intl';
import { Heart, Activity, Wind, Thermometer } from 'lucide-react';

export type VitalType = 'heartRate' | 'bloodPressure' | 'spo2' | 'temperature';

interface VitalCardProps {
  type: VitalType;
  value: number | string | null;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical' | null;
  safeRange: string;
}

export function VitalCard({ type, value, unit, status, safeRange }: VitalCardProps) {
  const t = useTranslations('health.vitals');

  const label = t(type);
  const statusLabel = status ? t(status) : null;
  const isLoading = value === null;

  const typeConfig = {
    heartRate: {
      color: 'text-rose-600',
      icon: <Heart size={18} className="animate-pulse" />,
    },
    bloodPressure: {
      color: 'text-teal-700',
      icon: <Activity size={18} />,
    },
    spo2: {
      color: 'text-indigo-600',
      icon: <Wind size={18} />,
    },
    temperature: {
      color: 'text-amber-600',
      icon: <Thermometer size={18} />,
    },
  }[type];

  const statusBadgeClass =
    status === 'normal'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'low' || status === 'high'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : status === 'critical'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-teal-50 text-teal-700 border-teal-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between pb-3">
        <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${typeConfig.color}`}>
          {typeConfig.icon}
          {label}
        </span>
        {statusLabel && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClass}`}>
            {statusLabel}
          </span>
        )}
        {isLoading && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
            {t('loading')}
          </span>
        )}
      </div>

      <div className="my-2">
        {isLoading ? (
          <div className="h-9 w-24 bg-slate-200 animate-pulse rounded my-1" />
        ) : (
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {typeof value === 'number'
              ? value.toFixed(type === 'temperature' ? 1 : 0)
              : value != null ? value : '--'}
            <span className="text-sm font-normal text-slate-500 ml-1.5">
              {unit}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 font-medium mt-2">
        {safeRange ? `${t('safeRange')}: ${safeRange}` : ''}
      </div>
    </div>
  );
}
