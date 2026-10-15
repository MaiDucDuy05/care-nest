'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Heart, Activity, Wind, Thermometer } from 'lucide-react';
import { VitalCard, VitalType } from './vital-card';
import { useTranslations } from 'next-intl';

export interface VitalsData {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  spo2?: number;
  temperature?: number;
}

interface VitalsGridProps {
  vitals: VitalsData | null;
}

function getHrStatus(hr?: number): 'normal' | 'low' | 'high' | 'critical' | null {
  if (hr == null) return null;
  if (hr < 50 || hr > 120) return 'critical';
  if (hr < 60 || hr > 90) return 'high';
  return 'normal';
}

function getBpStatus(sys?: number): 'normal' | 'low' | 'high' | 'critical' | null {
  if (sys == null) return null;
  if (sys < 90 || sys > 180) return 'critical';
  if (sys < 100 || sys > 140) return 'high';
  return 'normal';
}

function getSpo2Status(spo2?: number): 'normal' | 'low' | 'high' | 'critical' | null {
  if (spo2 == null) return null;
  if (spo2 < 90) return 'critical';
  if (spo2 < 95) return 'high';
  return 'normal';
}

function getTempStatus(temp?: number): 'normal' | 'low' | 'high' | 'critical' | null {
  if (temp == null) return null;
  if (temp < 35.5 || temp > 39.0) return 'critical';
  if (temp < 36.5 || temp > 37.5) return 'high';
  return 'normal';
}

export function VitalsGrid({ vitals }: VitalsGridProps) {
  const t = useTranslations('health.vitals');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    }}>
      <VitalCard
        type="heartRate"
        value={vitals?.heartRate ?? null}
        unit={t('bpm')}
        status={getHrStatus(vitals?.heartRate)}
        safeRange={t('hrRange')}
      />
      <VitalCard
        type="bloodPressure"
        value={vitals?.bloodPressureSystolic ?? null}
        unit={t('mmhg')}
        status={getBpStatus(vitals?.bloodPressureSystolic)}
        safeRange={t('bpRange')}
      />
      <VitalCard
        type="spo2"
        value={vitals?.spo2 ?? null}
        unit={t('percent')}
        status={getSpo2Status(vitals?.spo2)}
        safeRange={t('spo2Range')}
      />
      <VitalCard
        type="temperature"
        value={vitals?.temperature ?? null}
        unit={t('celsius')}
        status={getTempStatus(vitals?.temperature)}
        safeRange={t('tempRange')}
      />
    </div>
  );
}
