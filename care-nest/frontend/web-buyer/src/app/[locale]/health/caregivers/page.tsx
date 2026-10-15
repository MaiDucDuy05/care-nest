'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { InviteForm } from '@/components/caregivers/invite-form';
import { CaregiverList } from '@/components/caregivers/caregiver-list';
import type { Caregiver } from '@/services/caregivers.service';
import { caregiversService } from '@/services/caregivers.service';

export default function CaregiversPage() {
  const t = useTranslations('caregivers');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (email: string) => {
    const newCg = await caregiversService.invite(email);
    setCaregivers((prev) => [...prev, newCg]);
  };

  const handleRevoke = async (id: string) => {
    await caregiversService.revoke(id);
    setCaregivers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'REVOKED' as const } : c))
    );
  };

  const handleResend = async (id: string) => {
    await caregiversService.resendInvite(id);
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Invite Form */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
              <Users size={20} color="var(--primary)" /> {t('inviteTitle')}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('inviteDesc')}</p>
          </div>
          <InviteForm onInvite={handleInvite} disabled={isLoading} />
        </div>

        {/* Caregiver List */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            Danh sách người chăm sóc ({caregivers.length})
          </h2>
          <CaregiverList
            caregivers={caregivers}
            onRevoke={handleRevoke}
            onResend={handleResend}
          />
        </div>
      </div>
    </div>
  );
}
