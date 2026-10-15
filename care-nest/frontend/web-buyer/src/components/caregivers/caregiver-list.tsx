'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { User, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { useTranslations } from 'next-intl';
import type { Caregiver } from '@/services/caregivers.service';

interface CaregiverListProps {
  caregivers: Caregiver[];
  onRevoke: (id: string) => Promise<void>;
  onResend: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function CaregiverList({ caregivers, onRevoke, onResend, isLoading }: CaregiverListProps) {
  const t = useTranslations('caregivers');

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
        {t('loading')}
      </div>
    );
  }

  if (!caregivers.length) {
    return (
      <EmptyState
        icon={<User size={32} />}
        title={t('list.noCaregivers')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {caregivers.map((cg) => (
        <div
          key={cg.id}
          className="card"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: cg.status === 'REVOKED' ? 0.5 : 1,
          }}
        >
          {/* Avatar */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--secondary-light)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={22} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>
              {cg.fullName ?? cg.email}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} /> {cg.email}
            </div>
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span className={`badge ${
              cg.status === 'ACCEPTED' ? 'badge-green' :
              cg.status === 'PENDING' ? 'badge-indigo' :
              'badge-red'
            }`}>
              {cg.status === 'ACCEPTED' ? (
                <><CheckCircle size={12} /> {t('list.accepted')}</>
              ) : cg.status === 'PENDING' ? (
                <><Clock size={12} /> {t('list.pending')}</>
              ) : (
                <><XCircle size={12} /> Đã thu hồi</>
              )}
            </span>

            {cg.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onResend(cg.id)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  {t('resend')}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('revokeConfirm'))) onRevoke(cg.id);
                  }}
                  className="btn btn-danger"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  {t('revoke')}
                </button>
              </div>
            )}

            {cg.status === 'ACCEPTED' && (
              <button
                onClick={() => {
                  if (confirm(t('revokeConfirm'))) onRevoke(cg.id);
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)' }}
              >
                {t('revoke')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
