'use client';

interface Step {
  label: string;
  description?: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                background: isCompleted
                  ? 'var(--primary)'
                  : isActive
                  ? 'var(--secondary)'
                  : 'var(--bg-card-subtle)',
                color: isCompleted || isActive ? '#fff' : 'var(--text-muted)',
                border: `2px solid ${isCompleted ? 'var(--primary)' : isActive ? 'var(--secondary)' : 'var(--border-color)'}`,
                transition: 'all 0.3s ease',
              }}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                textAlign: 'center',
                maxWidth: '80px',
              }}>
                {step.label}
              </div>
            </div>

            {!isLast && (
              <div style={{
                flex: 1,
                height: '2px',
                background: isCompleted ? 'var(--primary)' : 'var(--border-color)',
                margin: '0 8px',
                marginBottom: '22px',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
