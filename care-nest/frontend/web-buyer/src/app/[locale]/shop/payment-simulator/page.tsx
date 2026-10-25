'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { PaymentSimulatorModal, PaymentGatewayType } from '@/components/payment/payment-simulator-modal';

function PaymentSimulatorContent() {
  const searchParams = useSearchParams();

  const initialAmount = searchParams?.get('amount')
    ? Number(searchParams.get('amount'))
    : 1850000;
  const initialOrder = searchParams?.get('orderNumber') || 'CN-20261024-DEMO';
  const initialMethod = (searchParams?.get('method') as PaymentGatewayType) || 'VNPAY';

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [amount, setAmount] = useState(initialAmount);
  const [method, setMethod] = useState<PaymentGatewayType>(initialMethod);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<any>(null);

  const formatVnd = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/shop/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={16} /> Quay lại Giỏ hàng
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
            <CreditCard size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
              Phòng Thử Nghiệm Giả Lập Thanh Toán Sandbox
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Mô phỏng trải nghiệm thanh toán trực tuyến qua VNPAY, Ví MoMo và Chuyển khoản VietQR
            </p>
          </div>
        </div>
      </div>

      {/* Preset Test Scenarios */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="font-bold text-base mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span>Chọn Kịch Bản Thanh Toán Thử Nghiệm:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setOrderNumber('CN-TEST-WONLEX-001');
              setAmount(1850000);
              setMethod('VNPAY');
              setLastPaymentResult(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              method === 'VNPAY' && amount === 1850000
                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-blue-700 block mb-1">Cổng VNPAY (ATM &amp; QR)</span>
            <div className="font-bold text-sm text-slate-800">Đồng Hồ Wonlex SOS</div>
            <div className="text-xs font-extrabold text-teal-700 mt-1">{formatVnd(1850000)}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderNumber('CN-TEST-OMRON-002');
              setAmount(890000);
              setMethod('MOMO');
              setLastPaymentResult(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              method === 'MOMO' && amount === 890000
                ? 'border-pink-600 bg-pink-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-pink-700 block mb-1">Ví Điện Tử MoMo</span>
            <div className="font-bold text-sm text-slate-800">Máy Đo Huyết Áp Omron</div>
            <div className="text-xs font-extrabold text-teal-700 mt-1">{formatVnd(890000)}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderNumber('CN-TEST-SUB-003');
              setAmount(149000);
              setMethod('BANK_TRANSFER');
              setLastPaymentResult(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              method === 'BANK_TRANSFER' && amount === 149000
                ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-emerald-700 block mb-1">VietQR Napas 24/7</span>
            <div className="font-bold text-sm text-slate-800">Gói Giám Sát Gia Đình</div>
            <div className="text-xs font-extrabold text-teal-700 mt-1">{formatVnd(149000)}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrderNumber('CN-TEST-WALLET-004');
              setAmount(450000);
              setMethod('CAREST_WALLET');
              setLastPaymentResult(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              method === 'CAREST_WALLET' && amount === 450000
                ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-teal-700 block mb-1">Ví CareNest Pay</span>
            <div className="font-bold text-sm text-slate-800">Nhiệt Kế Điện Tử SOS</div>
            <div className="text-xs font-extrabold text-teal-700 mt-1">{formatVnd(450000)}</div>
          </button>
        </div>

        {/* Custom parameters form */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mã đơn hàng thử nghiệm:</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Launch button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard size={18} />
          <span>Mở Cổng Giả Lập Thanh Toán (Sandbox Modal)</span>
        </button>
      </div>

      {/* Result feedback */}
      {lastPaymentResult && (
        <div className="card p-6 border-emerald-200 bg-emerald-50/50 animate-in fade-in">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 size={24} className="text-emerald-600" />
            <div>
              <h4 className="font-bold text-base text-emerald-950">
                Giao Dịch Thử Nghiệm Thành Công
              </h4>
              <p className="text-xs text-emerald-700">
                Hệ thống thanh toán đã phản hồi tín hiệu IPN/Webhook hợp lệ
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 text-xs font-mono space-y-1.5 text-slate-700 mb-4">
            <div>Mã đơn: <strong className="text-slate-900">{orderNumber}</strong></div>
            <div>Mã giao dịch: <strong className="text-emerald-700">{lastPaymentResult.transactionId}</strong></div>
            <div>Cổng thanh toán: <strong className="text-slate-900">{lastPaymentResult.method}</strong></div>
            <div>Số tiền: <strong className="text-teal-700">{formatVnd(amount)}</strong></div>
            <div>Thời gian: <strong>{new Date(lastPaymentResult.paidAt).toLocaleString('vi-VN')}</strong></div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              <ShoppingBag size={14} />
              <span>Xem Danh Sách Đơn Hàng</span>
            </Link>
          </div>
        </div>
      )}

      {/* The Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={isModalOpen}
        orderId={orderNumber}
        orderNumber={orderNumber}
        amount={amount}
        initialMethod={method}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(result) => {
          setLastPaymentResult(result);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

export default function PaymentSimulatorPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-slate-400">Đang tải phòng thử nghiệm...</div>}>
      <PaymentSimulatorContent />
    </Suspense>
  );
}
