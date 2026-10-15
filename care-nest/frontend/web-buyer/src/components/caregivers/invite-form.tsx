'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send } from 'lucide-react';

interface InviteFormProps {
  onInvite: (email: string) => Promise<void>;
  disabled?: boolean;
}

export function InviteForm({ onInvite, disabled }: InviteFormProps) {
  const t = useTranslations('caregivers');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(t('inviteError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
          {t('emailLabel')}
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
          }}>
            <Mail size={18} color="var(--text-muted)" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              disabled={disabled || isLoading}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={disabled || isLoading || !email}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isLoading ? t('inviting') : (
              <>
                <Send size={16} /> {t('inviteBtn')}
              </>
            )}
          </button>
        </div>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>{error}</p>
        )}
        {success && (
          <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '4px' }}>{t('inviteSuccess')}</p>
        )}
      </div>
    </form>
  );
}
