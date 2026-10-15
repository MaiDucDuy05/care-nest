'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            transition: 'var(--transition-smooth)',
          }}
          className={cn(className)}
          {...props}
        />
        {hint && !error && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hint}</span>
        )}
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
