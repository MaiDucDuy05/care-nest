'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured in ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-5 shadow-sm">
        <AlertCircle size={32} />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Đã Xảy Ra Lỗi Xử Lý
      </h1>

      <p className="text-slate-600 text-sm max-w-md mb-6 leading-relaxed">
        Hệ thống không thể tải dữ liệu trang này vào lúc này. Vui lòng thử lại hoặc quay về trang chủ.
      </p>

      {error?.message && (
        <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 font-mono mb-6 max-w-lg break-all text-left">
          {error.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
        >
          <RefreshCw size={16} /> Thử lại
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
        >
          <Home size={16} /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}
