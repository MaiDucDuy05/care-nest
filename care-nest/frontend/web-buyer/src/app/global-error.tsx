'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global root error:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Hệ thống đang được làm mới</h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '420px', marginBottom: '24px' }}>
            Ứng dụng gặp sự cố tạm thời trong quá trình tải tài nguyên. Vui lòng bấm thử lại hoặc tải lại trang.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Tải lại ứng dụng
          </button>
        </div>
      </body>
    </html>
  );
}
