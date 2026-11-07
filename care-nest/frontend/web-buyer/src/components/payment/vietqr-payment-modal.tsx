'use client';

import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Building2,
  QrCode,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export interface VietQrPaymentModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  amount: number;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  onClose: () => void;
  onPaidSuccess: () => void;
}

const BANK_NAMES: Record<string, string> = {
  MB: 'Ngân hàng TMCP Quân Đội (MB Bank)',
  VCB: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
  TCB: 'Ngân hàng TMCP Kỹ Thương (Techcombank)',
  BIDV: 'Ngân hàng TMCP Đầu tư và Phát triển (BIDV)',
  ICB: 'Ngân hàng TMCP Công Thương (VietinBank)',
  ACB: 'Ngân hàng TMCP Á Châu (ACB)',
  VPB: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
  TPB: 'Ngân hàng TMCP Tiên Phong (TPBank)',
};

export function VietQrPaymentModal({
  isOpen,
  orderId,
  orderNumber,
  amount,
  bankId = process.env.NEXT_PUBLIC_VIETQR_BANK_ID || 'MB',
  accountNo = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || '0987654321',
  accountName = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || 'CAREST PLATFORM',
  onClose,
  onPaidSuccess,
}: VietQrPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Nội dung chuyển khoản chuẩn theo mã đơn hàng
  const transferContent = `CN ${orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
  const bankFullName = BANK_NAMES[bankId] || `${bankId} Bank`;

  // URL tạo ảnh VietQR động chuẩn NAPAS
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatVnd = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Thanh toán Chuyển khoản VietQR
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Đơn hàng #{orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Alert Notice */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              marginBottom: '18px',
            }}
          >
            <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.45 }}>
              Mở <strong>App Ngân hàng</strong> (Banking) bất kỳ trên điện thoại và quét mã QR bên dưới để thanh toán tức thì.
            </p>
          </div>

          {/* QR Image Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                display: 'inline-block',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Mã VietQR thanh toán"
                style={{
                  width: '260px',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '6px',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontWeight: 500 }}>
              Mã QR tự động điền sẵn Số tiền &amp; Nội dung chuyển khoản
            </span>
          </div>

          {/* Manual Banking Details */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              Hoặc chuyển khoản thủ công theo thông tin:
            </div>

            {/* Ngân hàng */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Ngân hàng:</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                {bankFullName}
              </span>
            </div>

            {/* Số tài khoản */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Số tài khoản:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', color: '#047857' }}>
                  {accountNo}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNo, 'accountNo')}
                  style={{
                    background: copiedField === 'accountNo' ? '#dcfce7' : '#f1f5f9',
                    color: copiedField === 'accountNo' ? '#16a34a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedField === 'accountNo' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'accountNo' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Tên chủ tài khoản */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Chủ tài khoản:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {accountName}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(accountName, 'accountName')}
                  style={{
                    background: copiedField === 'accountName' ? '#dcfce7' : '#f1f5f9',
                    color: copiedField === 'accountName' ? '#16a34a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedField === 'accountName' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'accountName' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Số tiền */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Số tiền:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                  {formatVnd(amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(String(Math.round(amount)), 'amount')}
                  style={{
                    background: copiedField === 'amount' ? '#dcfce7' : '#f1f5f9',
                    color: copiedField === 'amount' ? '#16a34a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedField === 'amount' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Nội dung chuyển khoản */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Nội dung:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                  {transferContent}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(transferContent, 'content')}
                  style={{
                    background: copiedField === 'content' ? '#dcfce7' : '#f1f5f9',
                    color: copiedField === 'content' ? '#16a34a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedField === 'content' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#d97706',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống xác nhận thanh toán nhanh nhất.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={onPaidSuccess}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            <span>Tôi đã chuyển khoản</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
