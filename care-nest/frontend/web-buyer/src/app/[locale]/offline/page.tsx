'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      paddingTop: '60px',
      paddingBottom: '80px',
    }}>
      <div style={{
        background: 'var(--danger-light)',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <WifiOff size={40} color="var(--danger)" />
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
        Bạn Đang Ngoại Tuyến
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '32px', maxWidth: '400px' }}>
        Không có kết nối internet. Vui lòng kiểm tra wifi hoặc dữ liệu di động và thử lại.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
      >
        Thử lại
      </button>
    </div>
  );
}
