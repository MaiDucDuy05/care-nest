'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send, HeartHandshake } from 'lucide-react';

interface InviteFormProps {
  onInvite: (email: string, relationship: 'FAMILY' | 'NURSE' | 'DOCTOR' | 'OTHER') => Promise<void>;
  disabled?: boolean;
}

export function InviteForm({ onInvite, disabled }: InviteFormProps) {
  const t = useTranslations('caregivers');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<'FAMILY' | 'NURSE' | 'DOCTOR' | 'OTHER'>('FAMILY');
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
      await onInvite(email, relationship);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err?.message || t('inviteError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
          {t('emailLabel')}
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 2,
            minWidth: '220px',
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
              placeholder="caregiver@carenest.vn hoặc email người thân..."
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

          <div style={{
            flex: 1,
            minWidth: '150px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
          }}>
            <HeartHandshake size={18} color="var(--text-muted)" />
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as any)}
              disabled={disabled || isLoading}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                fontFamily: 'inherit',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <option value="FAMILY">Gia đình / Người thân</option>
              <option value="DOCTOR">Bác sĩ gia đình</option>
              <option value="NURSE">Điều dưỡng viên</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={disabled || isLoading || !email}
            style={{ whiteSpace: 'nowrap', minWidth: '130px' }}
          >
            {isLoading ? t('inviting') : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={16} /> {t('inviteBtn')}
              </span>
            )}
          </button>
        </div>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>{error}</p>
        )}
        {success && (
          <p style={{ color: 'var(--success)', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
            🎉 Đã gửi lời mời và kích hoạt quyền theo dõi thành công!
          </p>
        )}
      </div>
    </form>
  );
}

