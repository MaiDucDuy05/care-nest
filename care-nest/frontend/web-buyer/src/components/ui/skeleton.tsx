/** Skeleton loading component */
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
    />
  );
}

export function VitalsCardSkeleton() {
  return (
    <div className="vitals-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Skeleton style={{ width: '120px', height: '20px' }} />
        <Skeleton style={{ width: '60px', height: '22px' }} />
      </div>
      <Skeleton style={{ width: '100px', height: '40px', marginBottom: '8px' }} />
      <Skeleton style={{ width: '160px', height: '14px' }} />
    </div>
  );
}

export function AlertSkeleton() {
  return (
    <div style={{
      padding: '12px',
      borderRadius: 'var(--radius-md)',
      background: '#f8fafc',
      border: '1px solid var(--border-color)',
      display: 'flex',
      gap: '12px',
    }}>
      <Skeleton style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton style={{ width: '70%', height: '14px', marginBottom: '6px' }} />
        <Skeleton style={{ width: '50%', height: '12px' }} />
      </div>
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <Skeleton style={{ width: '120px', height: '24px', marginBottom: '12px' }} />
      <Skeleton style={{ width: '80px', height: '36px', marginBottom: '8px' }} />
      <Skeleton style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
      <Skeleton style={{ width: '60%', height: '14px' }} />
    </div>
  );
}
