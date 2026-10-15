'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      color: 'var(--text-muted)',
    }}>
      {icon && (
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--bg-card-subtle)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', color: 'var(--text-light)',
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '320px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
