'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('errors');

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
        fontSize: '80px',
        fontWeight: 800,
        color: 'var(--primary-light)',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        404
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
        {t('notFound')}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '32px', maxWidth: '400px' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link href="/" className="btn btn-primary">
          <Home size={16} /> Về trang chủ
        </Link>
        <button onClick={() => history.back()} className="btn btn-secondary">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    </div>
  );
}
