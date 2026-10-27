'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { canManageAdmins } from '@/lib/role-guard';
import { apiClient, type UserAdmin } from '@/lib/api-client';
import { UserTable } from '@/components/users/user-table';

export default function AdminsPage() {
  const t = useTranslations('settings');
  const { user, token } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAdmins = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.users.list(
        { page: p, limit: 50, role: 'ADMIN' },
        token ?? undefined
      );
      setAdmins(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && canManageAdmins(user.role)) {
      fetchAdmins(1);
    }
  }, [user, fetchAdmins]);

  if (!user || !canManageAdmins(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        You do not have permission to manage admins.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('admins')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('adminsDesc')}</p>
      </div>

      <UserTable
        data={admins}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => fetchAdmins(p)}
        onView={(u) => router.push(`/users/${u.id}`)}
      />
    </div>
  );
}
