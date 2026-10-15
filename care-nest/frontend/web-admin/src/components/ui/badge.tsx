'use client';

interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: 'var(--bg-card-subtle)', color: 'var(--text-muted)' },
  success: { background: 'var(--success-light)', color: '#065f46' },
  danger: { background: 'var(--danger-light)', color: '#991b1b' },
  warning: { background: 'var(--accent-light)', color: '#92400e' },
  info: { background: 'var(--primary-light)', color: '#134e4a' },
  secondary: { background: 'var(--secondary-light)', color: '#3730a3' },
};

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 600,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
