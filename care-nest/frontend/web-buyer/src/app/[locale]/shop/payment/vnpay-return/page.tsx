'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, ShieldCheck, CreditCard } from 'lucide-react';

const VNPAY_RESPONSE_MESSAGES: Record<string, string> = {
  '00': 'Giao dịch thành công.',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới gian lận, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
  '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản của bạn đang bị khóa.',
  '24': 'Bạn đã bấm hủy thanh toán giao dịch.',
  '51': 'Tài khoản của bạn không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản của bạn đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Khách hàng nhập sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi không xác định từ cổng thanh toán VNPAY.',
};

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function VnpayReturnContent() {
  const searchParams = useSearchParams();

  const responseCode = searchParams?.get('vnp_ResponseCode') || '99';
  const txnRef = searchParams?.get('vnp_TxnRef') || '';
  const rawAmount = searchParams?.get('vnp_Amount');
  const amount = rawAmount ? parseInt(rawAmount, 10) / 100 : 0;
  const bankCode = searchParams?.get('vnp_BankCode') || 'VNPAY';
  const transactionNo = searchParams?.get('vnp_TransactionNo') || '';
  const orderInfo = searchParams?.get('vnp_OrderInfo') || '';

  const isSuccess = responseCode === '00';
  const statusMessage = VNPAY_RESPONSE_MESSAGES[responseCode] || `Mã phản hồi VNPAY: ${responseCode}`;

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '640px' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', borderRadius: '24px' }}>
        {/* Status Icon */}
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

        {/* Title */}
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          {isSuccess ? 'Thanh Toán VNPAY Thành Công!' : 'Thanh Toán Không Thành Công'}
        </h1>

        <p style={{ color: isSuccess ? '#047857' : '#b91c1c', fontSize: '15px', marginBottom: '28px', fontWeight: 500 }}>
          {statusMessage}
        </p>

        {/* Transaction Summary Card */}
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

          {txnRef && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Mã tham chiếu đơn hàng:</span>
              <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{txnRef}</span>
            </div>
          )}

          {transactionNo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Mã giao dịch VNPAY:</span>
              <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>{transactionNo}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Phương thức:</span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>VNPAY-QR / {bankCode}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Trạng thái Escrow:</span>
            <span style={{ color: isSuccess ? '#059669' : '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
              {isSuccess ? 'Đang tạm giữ an toàn 7 ngày' : 'Chưa thu tiền'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
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

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Đang xác thực kết quả thanh toán từ VNPAY...</p>
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  );
}
