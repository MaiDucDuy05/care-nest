'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { WizardStepper } from '@/components/activation/wizard-stepper';
import { CodeInput } from '@/components/activation/code-input';
import { ImeiConfirm } from '@/components/activation/imei-confirm';
import { activationService } from '@/services/activation.service';

type Step = 0 | 1 | 2;

interface Device {
  deviceId: string;
  imei: string;
  model: string;
}

function ActivationContent() {
  const t = useTranslations('activation');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(0);
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { label: t('step1') },
    { label: t('step2') },
    { label: t('step3') },
  ];

  const handlePeek = async () => {
    if (token.length !== 8) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await activationService.peekCode(token);
      if (!result.valid) {
        setError(t('invalidToken'));
        return;
      }
      setDevices(result.devices ?? []);
      setSelectedIds(new Set(result.devices?.map((d) => d.deviceId) ?? []));
      setStep(1);
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (deviceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      await activationService.redeemCode(token, Array.from(selectedIds));
      setStep(2);
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '640px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          {t('subtitle')}
        </p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <WizardStepper currentStep={step} steps={steps} />
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <div className="card">
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('step1')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {t('step1Desc')}
            </p>
            <CodeInput
              value={token}
              onChange={setToken}
              onSubmit={handlePeek}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('step2')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {t('step2Desc')}
            </p>
            <ImeiConfirm
              devices={devices}
              selectedIds={selectedIds}
              onToggle={handleToggleSelect}
              onConfirm={handleConfirm}
              isLoading={isLoading}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 size={48} color="var(--success)" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              {t('successTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '28px' }}>
              {t('successDesc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => router.push('/health/dashboard')}
                className="btn btn-primary"
                style={{ padding: '14px' }}
              >
                {t('goToDashboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
          <div className="animate-spin text-teal-600 font-bold">Đang tải trang kích hoạt...</div>
        </div>
      }
    >
      <ActivationContent />
    </Suspense>
  );
}
