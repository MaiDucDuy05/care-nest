'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, CreditCard } from 'lucide-react';

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function MomoReturnContent() {
  const searchParams = useSearchParams();

  const resultCode = searchParams?.get('resultCode') || '99';
  const orderId = searchParams?.get('orderId') || '';
  const transId = searchParams?.get('transId') || searchParams?.get('requestId') || '';
  const rawAmount = searchParams?.get('amount');
  const amount = rawAmount ? parseInt(rawAmount, 10) : 0;
  const message = searchParams?.get('message') || '';

  const isSuccess = resultCode === '0';

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '640px' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', borderRadius: '24px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isSuccess ? '#ecfdf5' : '#fef2f2',
            color: isSuccess ? '#059669' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: `2px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {isSuccess ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          {isSuccess ? 'Thanh Toán Ví MoMo Thành Công!' : 'Thanh Toán MoMo Không Thành Công'}
        </h1>

        <p style={{ color: isSuccess ? '#047857' : '#b91c1c', fontSize: '15px', marginBottom: '28px', fontWeight: 500 }}>
          {message || (isSuccess ? 'Giao dịch qua Ví MoMo đã hoàn tất.' : 'Giao dịch bị từ chối hoặc đã bị hủy.')}
        </p>

        <div
          style={{
            background: 'var(--surface, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Số tiền:</span>
            <strong style={{ fontSize: '16px', color: isSuccess ? '#059669' : 'var(--text-main)' }}>
              {formatVnd(amount)}
            </strong>
          </div>

          {orderId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Mã đơn hàng:</span>
              <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{orderId}</span>
            </div>
          )}

          {transId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Mã giao dịch MoMo:</span>
              <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{transId}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Phương thức:</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Ví điện tử MoMo</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isSuccess ? (
            <>
              <Link
                href="/orders"
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                }}
              >
                <span>Xem đơn hàng của bạn</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/shop/products"
                className="btn btn-secondary"
                style={{
                  padding: '12px 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShoppingBag size={16} />
                <span>Tiếp tục mua sắm</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/shop/cart"
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                }}
              >
                <CreditCard size={16} />
                <span>Thử thanh toán lại</span>
              </Link>
              <Link
                href="/shop/products"
                className="btn btn-secondary"
                style={{
                  padding: '12px 20px',
                }}
              >
                Quay lại cửa hàng
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MomoReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang xác thực kết quả thanh toán từ Ví MoMo...</p>
        </div>
      }
    >
      <MomoReturnContent />
    </Suspense>
  );
}
