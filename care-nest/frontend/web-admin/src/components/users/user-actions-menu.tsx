'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { apiClient, type UserDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface UserActionsMenuProps {
  user: UserDetailResponse;
  onRefresh: () => void;
}

const ROLES = ['USER', 'SELLER', 'ADMIN', 'MEDICAL_REVIEWER'];

export function UserActionsMenu({ user, onRefresh }: UserActionsMenuProps) {
  const t = useTranslations('users');
  const { token } = useAuth();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  async function handleSuspend(reason?: string) {
    setLoading('suspend');
    try {
      await apiClient.users.suspend(user.id, reason || 'Suspended by admin', token ?? undefined);
      toast('success', t('suspendSuccess'));
      setSuspendOpen(false);
      setSuspendReason('');
      onRefresh();
    } catch {
      toast('error', 'Error suspending user');
    } finally {
      setLoading(null);
    }
  }

  async function handleUnsuspend() {
    setLoading('unsuspend');
    try {
      await apiClient.users.unsuspend(user.id, token ?? undefined);
      toast('success', t('unsuspendSuccess'));
      onRefresh();
    } catch {
      toast('error', 'Error unsuspending user');
    } finally {
      setLoading(null);
    }
  }

  async function handleRoleChange(newRole: string) {
    setLoading('role');
    try {
      await apiClient.users.updateRole(user.id, newRole, token ?? undefined);
      toast('success', t('roleChangedSuccess'));
      setRoleOpen(false);
      onRefresh();
    } catch {
      toast('error', 'Error changing role');
    } finally {
      setLoading(null);
    }
  }

  const isSuspended = user.status === 'SUSPENDED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Profile info */}
      <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('userId')}:</span> <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{user.id}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('fullName')}:</span> <span style={{ fontWeight: 600 }}>{user.fullName}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('email')}:</span> <span>{user.email}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('phone')}:</span> <span>{user.phone || '—'}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('role')}:</span> <Badge variant={user.role === 'ADMIN' ? 'danger' : 'default'}>{t(`roles.${user.role}`)}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('status')}:</span> <Badge variant={isSuspended ? 'danger' : 'success'}>{t(isSuspended ? 'suspended' : 'active')}</Badge></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('joinedAt')}:</span> <span>{formatDateTime(user.createdAt)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('lastLogin')}:</span> <span>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('totalOrders')}:</span> <span>{user.totalOrders ?? 0}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('totalSpent')}:</span> <span>{user.totalSpentVnd ? formatCurrency(user.totalSpentVnd) : '—'}</span></div>
        </div>
      </div>

      {/* Related data */}
      {user.orders?.length ? (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>{t('orders')} ({user.orders.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {user.orders.slice(0, 5).map((o) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                <span>{o.id.slice(0, 8)}...</span>
                <Badge variant={o.status === 'DELIVERED' ? 'success' : 'warning'}>{o.status}</Badge>
                <span>{formatCurrency(o.totalVnd)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {isSuspended ? (
          <Button variant="primary" onClick={handleUnsuspend} loading={loading === 'unsuspend'}>
            🔓 {t('unsuspend')}
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setSuspendOpen(true)} loading={loading === 'suspend'}>
            🚫 {t('suspend')}
          </Button>
        )}
        <Button variant="secondary" onClick={() => setRoleOpen(true)} loading={loading === 'role'}>
          👤 {t('changeRole')}
        </Button>
      </div>

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={handleSuspend}
        title={t('suspend')}
        description={t('suspendConfirm')}
        confirmText={t('suspend')}
        variant="danger"
        requireReason
        reasonPlaceholder={t('suspendReasonPlaceholder')}
        loading={loading === 'suspend'}
      />

      <ConfirmDialog
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        onConfirm={(reason) => handleRoleChange(reason || user.role)}
        title={t('changeRole')}
        description={t('changeRoleConfirm', { role: '' })}
        confirmText={t('changeRole')}
        variant="primary"
        loading={loading === 'role'}
      />
    </div>
  );
}
