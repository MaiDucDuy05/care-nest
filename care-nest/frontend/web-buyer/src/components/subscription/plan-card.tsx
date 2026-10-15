'use client';

import { Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Plan } from '@carenest/shared-types';

interface PlanCardProps {
  plan: Plan;
  isCurrent?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  showFeatures?: boolean;
}

export function PlanCard({ plan, isCurrent, isSelected, onSelect, showFeatures = true }: PlanCardProps) {
  const t = useTranslations('subscription');

  const priceLabel =
    plan.priceVnd === 0
      ? t('free')
      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.priceVnd);

  const intervalLabel = plan.interval === 'MONTHLY'
    ? `/ ${t('monthly')}`
    : plan.interval === 'QUARTERLY'
    ? `/ ${t('quarterly')}`
    : `/ ${t('yearly')}`;

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${isSelected ? 'var(--primary)' : isCurrent ? 'var(--success)' : 'var(--border-color)'}`,
        background: isSelected ? 'var(--primary-light)' : isCurrent ? 'var(--success-light)' : 'var(--bg-card)',
        cursor: onSelect ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: plan.isActive ? 1 : 0.5,
      }}
    >
      {isCurrent && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--success)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          {t('currentPlan')}
        </div>
      )}

      {plan.features.includes('FEATURED') && !isCurrent && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '12px',
          background: 'var(--accent)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Sparkles size={12} /> Phổ biến
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
          {plan.name}
        </h3>
        {plan.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{plan.description}</p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '32px', fontWeight: 800, color: plan.priceVnd === 0 ? 'var(--text-muted)' : 'var(--primary)' }}>
          {priceLabel}
        </span>
        {plan.priceVnd > 0 && (
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{intervalLabel}</span>
        )}
      </div>

      {showFeatures && plan.features.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {plan.features.slice(0, 5).map((feature, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Check size={14} color="var(--success)" style={{ flexShrink: 0 }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      )}

      {plan.deviceSlots != null && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
          {plan.deviceSlots === 1
            ? '1 thiết bị'
            : plan.deviceSlots
            ? `${plan.deviceSlots} thiết bị`
            : 'Không giới hạn thiết bị'}
        </div>
      )}

      {isSelected && !isCurrent && onSelect && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary)',
          color: '#fff',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '14px',
        }}>
          ✓ Đã chọn
        </div>
      )}
    </div>
  );
}
