'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Circle, Pentagon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GeofenceShape } from '@/lib/types';

interface GeofenceFormData {
  name: string;
  shape: GeofenceShape;
  radiusM?: number;
  centerLat?: number;
  centerLng?: number;
  alertEvents: string[];
  isActive: boolean;
}

interface GeofenceFormProps {
  onSubmit: (data: GeofenceFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<GeofenceFormData>;
  pendingLocation?: { lat: number; lng: number } | null;
}

export function GeofenceForm({ onSubmit, onCancel, initialData, pendingLocation }: GeofenceFormProps) {
  const t = useTranslations('geofence');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GeofenceFormData>({
    defaultValues: {
      shape: 'CIRCLE',
      isActive: true,
      alertEvents: ['ENTER', 'EXIT'],
      ...initialData,
    },
  });

  const shape = watch('shape');

  const handleFormSubmit = async (data: GeofenceFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
          {t('name')} *
        </label>
        <input
          {...register('name', { required: true, maxLength: 100 })}
          placeholder={t('namePlaceholder')}
          style={inputStyle}
        />
        {errors.name && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{t('required')}</span>}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          {t('shape')}
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className={`btn ${shape === 'CIRCLE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setValue('shape', 'CIRCLE')}
          >
            <Circle size={16} /> {t('circle')}
          </button>
          <button
            type="button"
            className={`btn ${shape === 'POLYGON' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setValue('shape', 'POLYGON')}
          >
            <Pentagon size={16} /> {t('polygon')}
          </button>
        </div>
      </div>

      {shape === 'CIRCLE' && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t('center')} ({pendingLocation ? `${pendingLocation.lat.toFixed(5)}, ${pendingLocation.lng.toFixed(5)}` : t('mapLoadError')})
            </label>
            <input type="hidden" {...register('centerLat', { valueAsNumber: true })} />
            <input type="hidden" {...register('centerLng', { valueAsNumber: true })} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Nhấn vào bản đồ để chọn tâm vùng
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {t('radius')} *
            </label>
            <input
              {...register('radiusM', {
                required: true,
                valueAsNumber: true,
                min: 11,
              })}
              type="number"
              placeholder="100"
              min="11"
              style={inputStyle}
            />
            {errors.radiusM && (
              <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                {(watch('radiusM') ?? 0) <= 10 ? t('radiusTooSmall') : t('required')}
              </span>
            )}
          </div>
        </>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          {t('alertEvents')}
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(['ENTER', 'EXIT', 'DWELL'] as const).map((event) => (
            <label key={event} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                value={event}
                {...register('alertEvents')}
                style={{ accentColor: 'var(--primary)' }}
              />
              {t(`alert${event.charAt(0) + event.slice(1).toLowerCase()}` as 'alertEnter' | 'alertExit' | 'alertDwell')}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          style={{ accentColor: 'var(--primary)' }}
        />
        <label htmlFor="isActive" style={{ fontSize: '14px', fontWeight: 600 }}>
          {t('isActive')}
        </label>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t('saving') : t('saveBtn')}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
};
