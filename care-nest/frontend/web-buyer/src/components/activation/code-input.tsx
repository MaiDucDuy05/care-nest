'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string | null;
  placeholder?: string;
}

export function CodeInput({ value, onChange, onSubmit, isLoading, error, placeholder }: CodeInputProps) {
  const t = useTranslations('activation');
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    onChange(v);
  };

  const isValid = value.length === 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '16px',
          border: `2px dashed ${error ? 'var(--danger)' : touched && isValid ? 'var(--primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card-subtle)',
          transition: 'border-color 0.2s ease',
        }}>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            placeholder={placeholder ?? t('tokenPlaceholder')}
            maxLength={8}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '8px',
              textAlign: 'center',
              width: '100%',
              fontFamily: 'inherit',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
            }}
            autoFocus
          />
        </div>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
          Mã kích hoạt gồm 8 ký tự (chữ hoa + số)
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid || isLoading}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          opacity: !isValid || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? t('validating') : t('peekBtn')}
      </button>
    </div>
  );
}
