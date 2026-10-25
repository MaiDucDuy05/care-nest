'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { kycService } from '@/lib/services/kyc.service';
import type { KYCStatus } from '@/lib/types';
import { ChevronLeft, ChevronRight, Check, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const step1Schema = z.object({
  businessName: z.string().min(2, 'Bắt buộc'),
  taxId: z.string().min(8, 'Mã số thuế tối thiểu 8 số'),
  businessAddress: z.string().min(5, 'Bắt buộc'),
  businessType: z.string().min(2, 'Bắt buộc'),
  businessPhone: z.string().min(8, 'Bắt buộc'),
  licenseNumber: z.string().min(3, 'Bắt buộc'),
});

const step3Schema = z.object({
  bankName: z.string().min(2, 'Bắt buộc'),
  bankAccount: z.string().min(6, 'Số tài khoản tối thiểu 6 số'),
  bankAccountName: z.string().min(2, 'Bắt buộc'),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step3Values = z.infer<typeof step3Schema>;

export default function KycPage() {
  const t = useTranslations('kyc.wizard');
  const tSteps = useTranslations('kyc.steps');
  const tFields = useTranslations('kyc.fields');
  const router = useRouter();

  const [initialLoading, setInitialLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);

  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<Step1Values | null>(null);
  const [step3, setStep3] = useState<Step3Values | null>(null);
  const [documents, setDocuments] = useState<{ license?: File; idFront?: File; idBack?: File }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const step1Form = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const step3Form = useForm<Step3Values>({ resolver: zodResolver(step3Schema) });

  const stepLabels = [tSteps('business'), tSteps('documents'), tSteps('bank'), tSteps('review')];

  useEffect(() => {
    let mounted = true;
    kycService.getStatus().then((status) => {
      if (mounted) {
        setKycStatus(status);
        setInitialLoading(false);
      }
    }).catch(() => {
      if (mounted) setInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleStep1 = (data: Step1Values) => {
    setStep1(data);
    setStep(1);
  };

  const handleStep2 = () => {
    if (!documents.license || !documents.idFront || !documents.idBack) {
      setSubmitError('Vui lòng tải lên đầy đủ 3 tài liệu');
      return;
    }
    setSubmitError(null);
    setStep(2);
  };

  const handleStep3 = (data: Step3Values) => {
    setStep3(data);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!step1 || !step3) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const files = [documents.license!, documents.idFront!, documents.idBack!].filter(Boolean) as File[];
      await kycService.submit({ ...step1, ...step3 }, files);
      setKycStatus('IN_REVIEW');
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Display status screen if already submitted
  if (kycStatus === 'IN_REVIEW') {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px 32px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Clock size={32} />
          </div>
          <h2 className="text-h2" style={{ marginBottom: 12 }}>
            Hồ sơ đang được xét duyệt
          </h2>
          <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Hồ sơ xác minh danh tính người bán của bạn đã được tiếp nhận thành công.
            Đội ngũ thẩm định CareNest đang tiến hành kiểm tra thông tin và tài liệu pháp lý.
            Kết quả sẽ được cập nhật trong vòng 24 giờ làm việc.
          </p>
          <div
            style={{
              background: 'var(--bg-card-subtle, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '16px',
              marginBottom: 24,
              textAlign: 'left',
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>Đang xét duyệt (IN_REVIEW)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Thời gian gửi:</span>
              <span>Đã tiếp nhận</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setKycStatus(null);
                setStep(0);
              }}
            >
              Cập nhật / Nộp lại hồ sơ
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                const s = await kycService.getStatus();
                setKycStatus(s);
                if (s === 'APPROVED') {
                  router.replace('/dashboard');
                }
              }}
            >
              <RefreshCw size={16} /> Kiểm tra lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === 'APPROVED') {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px 32px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--success-light, #dcfce7)',
              color: 'var(--success, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-h2" style={{ marginBottom: 12 }}>
            Hồ sơ đã được phê duyệt!
          </h2>
          <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Chúc mừng! Bạn đã hoàn tất xác minh KYC và tài khoản người bán đã kích hoạt.
            Bây giờ bạn có thể đăng tải sản phẩm, quản lý đơn hàng và sử dụng đầy đủ các tính năng.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => router.replace('/dashboard')}
          >
            Đi đến Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 0' }}>
      <h1 className="text-h2" style={{ marginBottom: 8 }}>
        {t('title')}
      </h1>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        {t('step')} {step + 1} {t('of')} {stepLabels.length} — {stepLabels[step]}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
        }}
      >
        {stepLabels.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: i === step ? 'var(--primary-light)' : i < step ? 'var(--success-light)' : 'var(--bg-card-subtle)',
              color: i === step ? 'var(--primary)' : i < step ? 'var(--success)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {i < step ? <Check size={16} /> : <span>{i + 1}</span>}
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <form
            onSubmit={step1Form.handleSubmit(handleStep1)}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <Field label={tFields('businessName')} reg={step1Form.register('businessName')} err={step1Form.formState.errors.businessName} />
            <Field label={tFields('taxId')} reg={step1Form.register('taxId')} err={step1Form.formState.errors.taxId} />
            <Field label={tFields('businessAddress')} reg={step1Form.register('businessAddress')} err={step1Form.formState.errors.businessAddress} />
            <Field label={tFields('businessType')} reg={step1Form.register('businessType')} err={step1Form.formState.errors.businessType} />
            <Field label={tFields('businessPhone')} reg={step1Form.register('businessPhone')} err={step1Form.formState.errors.businessPhone} />
            <Field label={tFields('licenseNumber')} reg={step1Form.register('licenseNumber')} err={step1Form.formState.errors.licenseNumber} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                {t('next')} <ChevronRight size={16} />
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FileField
              label={tFields('licenseFile')}
              file={documents.license}
              onFile={(f) => setDocuments((d) => ({ ...d, license: f }))}
            />
            <FileField
              label={tFields('idFrontFile')}
              file={documents.idFront}
              onFile={(f) => setDocuments((d) => ({ ...d, idFront: f }))}
            />
            <FileField
              label={tFields('idBackFile')}
              file={documents.idBack}
              onFile={(f) => setDocuments((d) => ({ ...d, idBack: f }))}
            />

            {submitError && (
              <div
                style={{
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  padding: 8,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>
                <ChevronLeft size={16} /> {t('back')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleStep2}>
                {t('next')} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={step3Form.handleSubmit(handleStep3)}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <Field label={tFields('bankName')} reg={step3Form.register('bankName')} err={step3Form.formState.errors.bankName} />
            <Field label={tFields('bankAccount')} reg={step3Form.register('bankAccount')} err={step3Form.formState.errors.bankAccount} />
            <Field label={tFields('bankAccountName')} reg={step3Form.register('bankAccountName')} err={step3Form.formState.errors.bankAccountName} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={16} /> {t('back')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('next')} <ChevronRight size={16} />
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="text-h3">Kiểm tra thông tin</h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
              {step1 && (
                <>
                  <SummaryRow label={tFields('businessName')} value={step1.businessName} />
                  <SummaryRow label={tFields('taxId')} value={step1.taxId} />
                  <SummaryRow label={tFields('businessAddress')} value={step1.businessAddress} />
                  <SummaryRow label={tFields('businessType')} value={step1.businessType} />
                  <SummaryRow label={tFields('businessPhone')} value={step1.businessPhone} />
                  <SummaryRow label={tFields('licenseNumber')} value={step1.licenseNumber} />
                </>
              )}
              {step3 && (
                <>
                  <SummaryRow label={tFields('bankName')} value={step3.bankName} />
                  <SummaryRow label={tFields('bankAccount')} value={step3.bankAccount} />
                  <SummaryRow label={tFields('bankAccountName')} value={step3.bankAccountName} />
                </>
              )}
            </dl>

            {submitError && (
              <div
                style={{
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  padding: 8,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                <ChevronLeft size={16} /> {t('back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="spinner" /> : t('submit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  reg,
  err,
}: {
  label: string;
  reg: ReturnType<ReturnType<typeof useForm>['register']>;
  err?: { message?: string };
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...reg} />
      {err?.message && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{err.message}</p>
      )}
    </div>
  );
}

function FileField({ label, file, onFile }: { label: string; file?: File; onFile: (f: File) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        className="input"
      />
      {file && <p className="text-sm text-muted" style={{ marginTop: 4 }}>{file.name}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted text-sm">{label}</dt>
      <dd style={{ fontWeight: 600 }}>{value}</dd>
    </>
  );
}
