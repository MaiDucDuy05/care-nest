'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Fingerprint,
  Radio,
  Sparkles,
  Wallet,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import {
  getWalletBalance,
  deductWalletBalance,
  topupWalletBalance,
  getCurrentDemoAccount,
} from '@/lib/demo-accounts';

export type PaymentGatewayType = 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD' | 'CAREST_WALLET';

interface PaymentSimulatorModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  amount: number;
  initialMethod?: PaymentGatewayType;
  onClose: () => void;
  onSuccess: (details: {
    transactionId: string;
    method: PaymentGatewayType;
    bankCode?: string;
    paidAt: string;
  }) => void;
  onFailure?: (error: string) => void;
}

const formatVnd = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

const VIETNAMESE_BANKS = [
  { code: 'VCB', name: 'Vietcombank', prefix: '970436', logo: 'https://cdn.vietqr.io/img/VCB.png', color: '#005b38' },
  { code: 'MB', name: 'MB Bank', prefix: '970422', logo: 'https://cdn.vietqr.io/img/MB.png', color: '#103989' },
  { code: 'TCB', name: 'Techcombank', prefix: '970407', logo: 'https://cdn.vietqr.io/img/TCB.png', color: '#e31837' },
  { code: 'BIDV', name: 'BIDV', prefix: '970418', logo: 'https://cdn.vietqr.io/img/BIDV.png', color: '#006560' },
  { code: 'ACB', name: 'ACB', prefix: '970416', logo: 'https://cdn.vietqr.io/img/ACB.png', color: '#004c8f' },
  { code: 'VPB', name: 'VPBank', prefix: '970432', logo: 'https://cdn.vietqr.io/img/VPB.png', color: '#008744' },
  { code: 'TPB', name: 'TPBank', prefix: '970423', logo: 'https://cdn.vietqr.io/img/TPB.png', color: '#5b2d86' },
  { code: 'VIB', name: 'VIB', prefix: '970441', logo: 'https://cdn.vietqr.io/img/VIB.png', color: '#005596' },
];

function playPaymentSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.24); // G5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.24); // C6

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.24);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch {
    // Ignore audio permission errors
  }
}

function playTapSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Silent
  }
}

function BankLogo({ bank }: { bank: (typeof VIETNAMESE_BANKS)[number] }) {
  const [hasError, setHasError] = useState(false);

  return (
    <span className="mb-1 flex h-7 w-full items-center justify-center">
      {hasError ? (
        <span className="text-[10px] font-extrabold tracking-wide text-slate-600">
          {bank.code}
        </span>
      ) : (
        <img
          src={bank.logo}
          alt={bank.name}
          loading="lazy"
          onError={() => setHasError(true)}
          className="max-h-full max-w-full object-contain"
        />
      )}
    </span>
  );
}

export function PaymentSimulatorModal({
  isOpen,
  orderNumber,
  amount,
  initialMethod = 'VNPAY',
  onClose,
  onSuccess,
  onFailure,
}: PaymentSimulatorModalProps) {
  const [activeGateway, setActiveGateway] = useState<PaymentGatewayType>(
    initialMethod === 'COD' ? 'VNPAY' : initialMethod
  );
  const [vnpayTab, setVnpayTab] = useState<'QR' | 'ATM' | 'VISA'>('QR');
  const [selectedBank, setSelectedBank] = useState('MB');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // VNPay ATM Form state
  const [cardNumber, setCardNumber] = useState('9704 1985 2619 1432');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN AN');
  const [cardExpiry, setCardExpiry] = useState('07/28');
  const [atmStep, setAtmStep] = useState<'CARD_FORM' | 'OTP_SMS'>('CARD_FORM');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpError, setOtpError] = useState<string | null>(null);

  // MoMo State
  const [momoMode, setMomoMode] = useState<'BIOMETRIC' | 'PIN' | 'QR'>('BIOMETRIC');
  const [momoPin, setMomoPin] = useState('');
  const [isScanningFace, setIsScanningFace] = useState(false);

  // VietQR Auto Polling State
  const [autoPollSuccessNotice, setAutoPollSuccessNotice] = useState<string | null>(null);

  // CareNest Pay Wallet State
  const [walletBalance, setWalletBalance] = useState(5250000);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [simulatedError, setSimulatedError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    transactionId: string;
    authCode: string;
    method: PaymentGatewayType;
    bankCode?: string;
    paidAt: string;
  } | null>(null);

  // Countdown timer simulation (14:59)
  const [countdown, setCountdown] = useState(899);

  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Sync wallet balance & reset on open
  useEffect(() => {
    if (isOpen) {
      setWalletBalance(getWalletBalance());
      setSuccessData(null);
      setSimulatedError(null);
      setIsProcessing(false);
      setAtmStep('CARD_FORM');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setMomoPin('');
      setAutoPollSuccessNotice(null);
    }
  }, [isOpen]);

  // Main countdown timer (15:00)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // OTP Timer countdown
  useEffect(() => {
    if (!isOpen || atmStep !== 'OTP_SMS') return;
    const timer = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, atmStep]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    playTapSound();
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Card number input formatting (auto 4 digits)
  const handleCardNumberChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);

    // Auto-detect bank from prefix
    const matchedBank = VIETNAMESE_BANKS.find((b) => cleaned.startsWith(b.prefix));
    if (matchedBank) {
      setSelectedBank(matchedBank.code);
    }
  };

  // OTP Digits change
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError(null);

    // Auto focus next input
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleFillQuickOtp = () => {
    playTapSound();
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
    setOtpError(null);
  };

  // General success trigger
  const finalizePayment = async (method: PaymentGatewayType, bankCode?: string) => {
    setSimulatedError(null);
    setIsProcessing(true);
    setProcessingStep('Đang mã hóa kết nối bảo mật SHA-256...');

    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep('Đang xác thực thông tin với Ngân hàng / Cổng trung gian...');

    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep('Giao dịch hợp lệ. Đang khởi tạo thông báo IPN...');

    await new Promise((r) => setTimeout(r, 400));
    setIsProcessing(false);

    const transactionId = `TXN-${method}-${Date.now().toString().slice(-8)}`;
    const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidAt = new Date().toISOString();

    const result = {
      transactionId,
      authCode,
      method,
      bankCode: bankCode || selectedBank,
      paidAt,
    };

    playPaymentSuccessChime();
    setSuccessData(result);
    onSuccess(result);
  };

  // Trigger CareNest Wallet payment
  const handlePayWithWallet = async () => {
    const res = deductWalletBalance(amount);
    if (!res.success) {
      setWalletError(res.error || 'Số dư ví không đủ.');
      return;
    }
    setWalletBalance(res.newBalance);
    await finalizePayment('CAREST_WALLET', 'CAREST_PAY');
  };

  // Top up sandbox wallet
  const handleTopupSandbox = () => {
    playTapSound();
    const updated = topupWalletBalance(5000000);
    setWalletBalance(updated);
    setWalletError(null);
  };

  // Trigger MoMo Biometric
  const handleMoMoBiometric = async () => {
    playTapSound();
    setIsScanningFace(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsScanningFace(false);
    await finalizePayment('MOMO', 'MOMO_WALLET');
  };

  // Trigger MoMo PIN pad
  const handleMoMoPinInput = (num: string) => {
    playTapSound();
    if (momoPin.length < 6) {
      const next = momoPin + num;
      setMomoPin(next);
      if (next.length === 6) {
        setTimeout(() => {
          finalizePayment('MOMO', 'MOMO_PIN');
        }, 300);
      }
    }
  };

  // Trigger Instant Bank Transfer Simulation
  const handleSimulateBankTransferReceived = async () => {
    playTapSound();
    setAutoPollSuccessNotice(
      `Đã nhận +${formatVnd(amount)} vào STK MB Bank 0987654321 từ NGUYEN VAN AN (VCB). Nội dung: CN ${orderNumber}`
    );
    await new Promise((r) => setTimeout(r, 800));
    await finalizePayment('BANK_TRANSFER', 'MB');
  };

  // Submit OTP Step
  const handleSubmitOtp = async () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP SMS.');
      return;
    }
    if (entered !== '123456') {
      setOtpError('Mã OTP không chính xác. Mã thử nghiệm hợp lệ là: 123456');
      return;
    }
    await finalizePayment('VNPAY', selectedBank);
  };

  const handleSimulateFailure = async (reason = 'Mã lỗi 51: Số dư tài khoản không đủ để thực hiện giao dịch.') => {
    setIsProcessing(true);
    setProcessingStep('Đang kiểm tra phản hồi từ ngân hàng phát hành...');
    await new Promise((r) => setTimeout(r, 800));
    setIsProcessing(false);
    setSimulatedError(reason);
    onFailure?.(reason);
  };

  const activeBankObj = VIETNAMESE_BANKS.find((b) => b.code === selectedBank) || VIETNAMESE_BANKS[1];
  const activeDemoUser = getCurrentDemoAccount();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">Cổng Giả Lập Thanh Toán Sandbox</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Mô Phỏng Chân Thực
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Thử nghiệm an toàn: OTP SMS, Thẻ ATM Napas, Ví MoMo, VietQR &amp; Ví CareNest Pay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Info Summary Bar */}
        <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50/50 px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500 text-xs">Mã đơn hàng:</span>{' '}
            <strong className="font-mono text-slate-900 font-bold">{orderNumber}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Tổng thanh toán:</span>
            <span className="text-base sm:text-lg font-extrabold text-teal-700">
              {formatVnd(amount)}
            </span>
          </div>
        </div>

        {/* Gateway Selector Tabs */}
        {!successData && (
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-2.5 gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveGateway('VNPAY'); setSimulatedError(null); }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeGateway === 'VNPAY'
                  ? 'border-blue-600 text-blue-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
                V
              </span>
              <span>Cổng VNPAY</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveGateway('MOMO'); setSimulatedError(null); }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeGateway === 'MOMO'
                  ? 'border-pink-600 text-pink-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded bg-pink-600 text-white flex items-center justify-center text-[9px] font-black">
                M
              </span>
              <span>Ví MoMo</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveGateway('BANK_TRANSFER'); setSimulatedError(null); }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeGateway === 'BANK_TRANSFER'
                  ? 'border-emerald-600 text-emerald-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={14} className="text-emerald-600" />
              <span>VietQR Napas 24/7</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveGateway('CAREST_WALLET'); setSimulatedError(null); }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeGateway === 'CAREST_WALLET'
                  ? 'border-teal-600 text-teal-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet size={14} className="text-teal-600" />
              <span>Ví CareNest Pay</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* PROCESSING OVERLAY */}
          {isProcessing && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-4 shadow-xs">
                <RefreshCw size={28} className="animate-spin text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Đang Xử Lý Giao Dịch Bảo Mật...</h3>
              <p className="text-xs text-slate-500 animate-pulse">{processingStep}</p>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {!isProcessing && successData && (
            <div className="py-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 animate-in zoom-in duration-300 shadow-sm">
                <CheckCircle2 size={38} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                Thanh Toán Thành Công!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                Hệ thống thanh toán đã ghi nhận biên nhận thành công cho đơn hàng{' '}
                <strong className="text-slate-800">{orderNumber}</strong>.
              </p>

              {/* Receipt card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 w-full max-w-md text-left text-xs space-y-2.5 mb-6">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mã giao dịch (Txn ID):</span>
                  <span className="font-mono font-bold text-slate-900">{successData.transactionId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mã chuẩn chi (Auth Code):</span>
                  <span className="font-mono font-bold text-teal-700">{successData.authCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Cổng thanh toán:</span>
                  <span className="font-semibold text-slate-800">
                    {successData.method === 'VNPAY'
                      ? 'VNPAY Sandbox (Napas/QR)'
                      : successData.method === 'MOMO'
                      ? 'Ví Điện Tử MoMo Sandbox'
                      : successData.method === 'BANK_TRANSFER'
                      ? `VietQR Napas 24/7 (${successData.bankCode || 'MB Bank'})`
                      : 'Ví Sức Khỏe CareNest Pay'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tiền đã trừ:</span>
                  <span className="font-bold text-emerald-700">{formatVnd(amount)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Thời gian ghi nhận:</span>
                  <span className="text-slate-700">{new Date(successData.paidAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                >
                  Hoàn Tất &amp; Xem Đơn Hàng
                </button>
              </div>
            </div>
          )}

          {/* SIMULATION ERROR BANNER */}
          {!isProcessing && simulatedError && !successData && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-900 block mb-0.5">Mô phỏng thanh toán thất bại</strong>
                <span>{simulatedError}</span>
              </div>
            </div>
          )}

          {/* TAB 1: VNPAY */}
          {!isProcessing && !successData && activeGateway === 'VNPAY' && (
            <div className="space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setVnpayTab('QR')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    vnpayTab === 'QR' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  VNPAY-QR
                </button>
                <button
                  type="button"
                  onClick={() => setVnpayTab('ATM')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    vnpayTab === 'ATM' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Thẻ ATM Nội Địa (Napas)
                </button>
                <button
                  type="button"
                  onClick={() => setVnpayTab('VISA')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    vnpayTab === 'VISA' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Thẻ Quốc Tế (Visa/Master)
                </button>
              </div>

              {/* Subtab VNPAY-QR */}
              {vnpayTab === 'QR' && (
                <div className="flex flex-col items-center text-center p-4 bg-blue-50/40 rounded-2xl border border-blue-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3">
                    <img
                      src={`https://api.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${amount}&addInfo=VNPAY_${orderNumber}&accountName=CAREST_VNPAY_SANDBOX`}
                      alt="VNPay QR Sandbox"
                      className="w-44 h-44 object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Mã QR hết hạn sau: <span className="font-bold text-rose-600">{timerStr}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 max-w-xs mb-3">
                    Quét mã bằng ứng dụng Vietcombank, MB Bank, Techcombank hoặc ví điện tử bất kỳ
                  </p>

                  <button
                    type="button"
                    onClick={() => finalizePayment('VNPAY', 'VNPAY_QR')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Smartphone size={15} />
                    <span>Mô Phỏng Đã Quét &amp; Xác Nhận Trên App Ngân Hàng</span>
                  </button>
                </div>
              )}

              {/* Subtab VNPAY-ATM (Napas Card + OTP) */}
              {vnpayTab === 'ATM' && (
                <div className="space-y-4">
                  {atmStep === 'CARD_FORM' ? (
                    <>
                      {/* Realistic Bank Card Visual */}
                      <div
                        className="p-4 rounded-2xl text-white shadow-md relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${activeBankObj.color} 0%, #0f172a 100%)`,
                          minHeight: '140px',
                        }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-black tracking-widest uppercase">
                            NAPAS • {activeBankObj.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-mono">
                            DEBIT CARD
                          </span>
                        </div>

                        {/* EMV Chip */}
                        <div className="w-9 h-7 rounded bg-amber-300/80 border border-amber-400 mb-3 flex items-center justify-center">
                          <div className="w-5 h-3 border-y border-amber-600/40"></div>
                        </div>

                        <div className="font-mono text-base sm:text-lg font-bold tracking-widest mb-2">
                          {cardNumber || '9704 •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between text-[11px] text-white/80 uppercase font-mono">
                          <span>{cardHolder || 'NGUYEN VAN AN'}</span>
                          <span>EXP: {cardExpiry || '07/28'}</span>
                        </div>
                      </div>

                      {/* Bank Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chọn ngân hàng phát hành thẻ:
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {VIETNAMESE_BANKS.map((b) => (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => {
                                setSelectedBank(b.code);
                                setCardNumber(`${b.prefix} 1985 2619 1432`);
                              }}
                              className={`p-1.5 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                                selectedBank === b.code
                                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-1 ring-blue-500'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <BankLogo bank={b} />
                              <span className="truncate block">{b.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Input fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Số thẻ ATM (16 số):
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="9704 xxxx xxxx xxxx"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Tên chủ thẻ (In không dấu):
                            </label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="NGUYEN VAN AN"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Ngày phát hành (MM/YY):
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="07/28"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCardNumber('9704 2288 3921 5566');
                            setCardHolder('NGUYEN VAN AN');
                            setCardExpiry('08/29');
                            setSelectedBank('MB');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          ✨ Điền Nhanh Thẻ Test MB
                        </button>

                        <button
                          type="button"
                          onClick={() => setAtmStep('OTP_SMS')}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Tiếp Tục Xác Thực OTP SMS</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* OTP SMS STEP */
                    <div className="space-y-4">
                      {/* Realistic SMS Incoming Banner */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-3 animate-in slide-in-from-top-2">
                        <MessageSquare size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold text-amber-950 mb-0.5">
                            Tin nhắn SMS từ Ngân Hàng ({selectedBank}):
                          </strong>
                          <span>
                            Ma xac thuc OTP cho giao dich thanh toan tai CARENEST la{' '}
                            <strong className="font-mono text-sm text-rose-700 bg-amber-100 px-1 py-0.5 rounded">
                              123456
                            </strong>
                            . Hieu luc trong {otpTimer} giay. Khong chia se ma nay cho bat ky ai.
                          </span>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">
                          Xác Thực Giao Dịch Bằng Mã OTP
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                          Mã xác thực gồm 6 chữ số đã được gửi đến số điện thoại đăng ký ngân hàng.
                        </p>

                        {/* 6 OTP boxes */}
                        <div className="flex justify-center gap-2 mb-3">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpInputsRef.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && idx > 0) {
                                  otpInputsRef.current[idx - 1]?.focus();
                                }
                              }}
                              className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50"
                            />
                          ))}
                        </div>

                        {otpError && (
                          <div className="text-xs font-semibold text-rose-600 mb-3 animate-pulse">
                            {otpError}
                          </div>
                        )}

                        <div className="flex justify-center items-center gap-3 text-xs mb-4">
                          <button
                            type="button"
                            onClick={handleFillQuickOtp}
                            className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                          >
                            ⚡ Nhập Nhanh Mã Test 123456
                          </button>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">
                            Gửi lại sau: <strong>{otpTimer}s</strong>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAtmStep('CARD_FORM')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          >
                            Quay lại
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitOtp}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                          >
                            Xác Nhận &amp; Hoàn Tất Thanh Toán
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab VNPAY-VISA */}
              {vnpayTab === 'VISA' && (
                <div className="space-y-3">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        International Credit
                      </span>
                      <span className="font-extrabold italic text-sm text-amber-400">VISA</span>
                    </div>
                    <div className="font-mono text-base font-bold tracking-widest mb-3">
                      4000 0012 3456 7890
                    </div>
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>NGUYEN VAN AN</span>
                      <span>12/28 • CVV: 123</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('VNPAY', 'VISA')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Mô Phỏng Xác Thực 3D-Secure &amp; Trừ Tiền Thẻ Visa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOMO */}
          {!isProcessing && !successData && activeGateway === 'MOMO' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-pink-600 flex items-center justify-center font-black text-xl shadow-xs">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-sm">Ví Điện Tử MoMo Sandbox</div>
                    <div className="text-xs text-pink-100">
                      Tài khoản: {activeDemoUser?.fullName || 'Nguyễn Văn An'} (
                      {activeDemoUser?.phone || '0912 345 678'})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-pink-100">Số dư ví MoMo:</div>
                  <div className="text-sm font-extrabold text-white">5.450.000 đ</div>
                </div>
              </div>

              {/* MoMo Mode Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setMomoMode('BIOMETRIC')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    momoMode === 'BIOMETRIC' ? 'bg-white text-pink-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Face ID / Vân Tay
                </button>
                <button
                  type="button"
                  onClick={() => setMomoMode('PIN')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    momoMode === 'PIN' ? 'bg-white text-pink-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Nhập Mã PIN (6 Số)
                </button>
                <button
                  type="button"
                  onClick={() => setMomoMode('QR')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    momoMode === 'QR' ? 'bg-white text-pink-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Quét Mã MoMo QR
                </button>
              </div>

              {momoMode === 'BIOMETRIC' && (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-pink-50/40 rounded-2xl border border-pink-100">
                  <button
                    type="button"
                    disabled={isScanningFace}
                    onClick={handleMoMoBiometric}
                    className="w-20 h-20 rounded-full bg-white border-2 border-pink-400 text-pink-600 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer mb-3 group"
                  >
                    {isScanningFace ? (
                      <RefreshCw size={36} className="animate-spin text-pink-600" />
                    ) : (
                      <Fingerprint size={42} className="group-hover:text-pink-700" />
                    )}
                  </button>

                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {isScanningFace ? 'Đang xác thực sinh trắc học...' : 'Chạm để xác thực Face ID / Vân Tay'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-3">
                    Bảo mật chuẩn FIDO2. Giao dịch sẽ được trừ trực tiếp từ số dư Ví MoMo.
                  </p>

                  <button
                    type="button"
                    onClick={handleMoMoBiometric}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-xs cursor-pointer"
                  >
                    Xác Nhận Thanh Toán {formatVnd(amount)}
                  </button>
                </div>
              )}

              {momoMode === 'PIN' && (
                <div className="flex flex-col items-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    Nhập mã PIN Ví MoMo (Mã test: 123456):
                  </div>

                  {/* 6 PIN Dots */}
                  <div className="flex gap-3 mb-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          i < momoPin.length
                            ? 'bg-pink-600 border-pink-600 scale-110'
                            : 'bg-white border-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-2 w-48 mb-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleMoMoPinInput(n)}
                        className="py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-bold text-sm text-slate-800 shadow-2xs cursor-pointer active:scale-95"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMomoPin('')}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-600 cursor-pointer"
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoMoPinInput('0')}
                      className="py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-bold text-sm text-slate-800 shadow-2xs cursor-pointer active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMomoPin('123456');
                        setTimeout(() => finalizePayment('MOMO', 'MOMO_PIN'), 300);
                      }}
                      className="py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 font-bold text-xs text-pink-700 cursor-pointer"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              )}

              {momoMode === 'QR' && (
                <div className="flex flex-col items-center text-center p-4 bg-pink-50/40 rounded-2xl border border-pink-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3">
                    <img
                      src={`https://api.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${amount}&addInfo=MOMO_${orderNumber}&accountName=CAREST_MOMO_TEST`}
                      alt="MoMo QR Sandbox"
                      className="w-40 h-40 object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Hết hạn sau: <span className="font-bold text-pink-600">{timerStr}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('MOMO', 'MOMO_QR')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Smartphone size={15} />
                    <span>Mô Phỏng Ứng Dụng MoMo Đã Quét Mã Thành Công</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BANK TRANSFER (VIETQR NAPAS 24/7) */}
          {!isProcessing && !successData && activeGateway === 'BANK_TRANSFER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* QR Code */}
                <div className="md:col-span-5 flex flex-col items-center text-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={`https://api.vietqr.io/image/970422-0987654321-compact2.jpg?amount=${amount}&addInfo=CN_${orderNumber}&accountName=CAREST_HEALTHCARE`}
                    alt="VietQR 24/7"
                    className="w-40 h-40 object-contain rounded-lg shadow-2xs mb-2"
                  />
                  <span className="text-[11px] font-medium text-slate-500">
                    Quét bằng mọi ứng dụng ngân hàng
                  </span>
                </div>

                {/* Bank Account Details */}
                <div className="md:col-span-7 space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-[11px]">Ngân hàng nhận:</div>
                      <div className="font-bold text-slate-900">MB Bank (Ngân Hàng Quân Đội)</div>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                      Napas 24/7
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-[11px]">Số tài khoản:</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">0987654321</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('0987654321', 'acc')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'acc' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-[11px]">Chủ tài khoản:</div>
                      <div className="font-bold text-slate-900">CAREST HEALTHCARE TMDT</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-[11px]">Nội dung chuyển khoản (Bắt buộc):</div>
                      <div className="font-mono font-bold text-teal-700">CN {orderNumber}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`CN ${orderNumber}`, 'memo')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {copiedField === 'memo' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE RADAR WEBHOOK POLLING SIMULATION */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>
                    <strong className="font-bold">Đang lắng nghe tín hiệu chuyển khoản tự động...</strong>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700">Webhook Napas 24/7</span>
                </div>

                {autoPollSuccessNotice ? (
                  <div className="p-2 bg-white rounded-lg border border-emerald-300 font-mono text-[11px] text-emerald-800 mb-2">
                    {autoPollSuccessNotice}
                  </div>
                ) : (
                  <p className="text-slate-600 mb-3">
                    Hệ thống sẽ tự động bắt giao dịch và chuyển trạng thái đơn hàng khi phát hiện dòng tiền.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSimulateBankTransferReceived}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Radio size={15} />
                  <span>⚡ Giả Lập Ngân Hàng Báo Có Tiền Ngay Lập Tức</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CARENEST PAY WALLET */}
          {!isProcessing && !successData && activeGateway === 'CAREST_WALLET' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Ví Sức Khỏe CareNest Pay</div>
                    <div className="text-xs text-teal-100">
                      Chủ sở hữu: {activeDemoUser?.fullName || 'Nguyễn Văn An'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-teal-100">Số dư khả dụng:</div>
                  <div className="text-base font-extrabold text-white">{formatVnd(walletBalance)}</div>
                </div>
              </div>

              {walletError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                  {walletError}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Số tiền đơn hàng:</span>
                  <span className="font-bold text-slate-800">{formatVnd(amount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Số dư ví hiện tại:</span>
                  <span className="font-bold text-teal-700">{formatVnd(walletBalance)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Số dư còn lại sau thanh toán:</span>
                  <span
                    className={`font-bold ${
                      walletBalance >= amount ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatVnd(Math.max(0, walletBalance - amount))}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTopupSandbox}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  + Nạp Thêm 5.000.000 đ
                </button>

                <button
                  type="button"
                  onClick={handlePayWithWallet}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Thanh Toán Ngay Bằng Ví CareNest Pay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Simulation Control Buttons */}
        {!successData && !isProcessing && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => handleSimulateFailure('Người dùng hủy bỏ thao tác thanh toán.')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              Mô Phỏng Hủy / Thất Bại
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => finalizePayment(activeGateway)}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Xác Nhận Thành Công Ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
