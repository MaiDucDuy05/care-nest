'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export default function ProfilePage() {
  const t = useTranslations('settings');
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      // TODO: call profile update API
      await new Promise((r) => setTimeout(r, 500));
      toast('success', t('profileUpdated'));
    } catch {
      toast('error', 'Error updating profile');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('profile')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('profileDesc')}</p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Email" value={user.email} disabled />
        <Input label={t('fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{t('role')}</label>
          <div style={{ marginTop: '4px' }}>
            <Badge variant={user.role === 'ADMIN' ? 'danger' : 'default'}>{t(`profile.roles.${user.role}`)}</Badge>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>{t('joinedAt')}</label>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.createdAt}</div>
        </div>

        <div style={{ display: 'flex' }}>
          <Button onClick={handleSave} loading={loading}>{t('save')}</Button>
        </div>
      </div>
    </div>
  );
}
