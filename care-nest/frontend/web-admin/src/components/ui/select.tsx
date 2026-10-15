'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
          className={className}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
