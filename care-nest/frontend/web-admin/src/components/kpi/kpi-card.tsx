'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: number;
  variant?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
}

const variantBg: Record<string, string> = {
  default: 'var(--bg-card)',
  primary: 'var(--primary-light)',
  danger: 'var(--danger-light)',
  warning: 'var(--accent-light)',
  success: 'var(--success-light)',
};

const variantColor: Record<string, string> = {
  default: 'var(--text-main)',
  primary: 'var(--primary)',
  danger: 'var(--danger)',
  warning: 'var(--accent)',
  success: 'var(--success)',
};

export function KpiCard({ title, value, description, icon, trend, variant = 'default' }: KpiCardProps) {
  return (
    <div style={{
      background: variantBg[variant],
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: variantColor[variant], lineHeight: 1.2 }}>
            {value}
          </div>
          {description && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {description}
            </div>
          )}
          {trend !== undefined && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              marginTop: '6px', fontSize: '12px', fontWeight: 600,
              color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
            }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
