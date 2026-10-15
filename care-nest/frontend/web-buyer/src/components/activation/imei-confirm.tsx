'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Device {
  deviceId: string;
  imei: string;
  model: string;
}

interface ImeiConfirmProps {
  devices: Device[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ImeiConfirm({ devices, selectedIds, onToggle, onConfirm, isLoading }: ImeiConfirmProps) {
  const t = useTranslations('activation');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
        {t('selectDevices')} ({selectedIds.size}/{devices.length})
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {devices.map((device) => (
          <label
            key={device.deviceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${selectedIds.has(device.deviceId) ? 'var(--primary)' : 'var(--border-color)'}`,
              background: selectedIds.has(device.deviceId) ? 'var(--primary-light)' : 'var(--bg-card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(device.deviceId)}
              onChange={() => onToggle(device.deviceId)}
              style={{
                width: '20px',
                height: '20px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{device.model}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                IMEI: {device.imei}
              </div>
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: selectedIds.has(device.deviceId) ? 'var(--primary)' : 'var(--bg-card-subtle)',
              border: `2px solid ${selectedIds.has(device.deviceId) ? 'var(--primary)' : 'var(--border-color)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedIds.has(device.deviceId) ? '#fff' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {selectedIds.has(device.deviceId) ? '✓' : '?'}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={selectedIds.size === 0 || isLoading}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          opacity: selectedIds.size === 0 || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? t('activating') : t('confirmBtn')}
      </button>
    </div>
  );
}
