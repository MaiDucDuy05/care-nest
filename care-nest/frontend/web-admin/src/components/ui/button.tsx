'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 600,
      borderRadius: 'var(--radius-sm)',
      transition: 'var(--transition-smooth)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      border: 'none',
      fontFamily: 'inherit',
    };

    const variants: Record<string, React.CSSProperties> = {
      primary: { background: 'var(--primary)', color: '#fff' },
      secondary: { background: 'var(--secondary)', color: '#fff' },
      danger: { background: 'var(--danger)', color: '#fff' },
      ghost: { background: 'transparent', color: 'var(--text-main)' },
      outline: { background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' },
    };

    const sizes: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: '13px' },
      md: { padding: '8px 16px', fontSize: '14px' },
      lg: { padding: '12px 24px', fontSize: '16px' },
    };

    return (
      <button
        ref={ref}
        style={{ ...base, ...variants[variant], ...sizes[size] }}
        className={cn(className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
