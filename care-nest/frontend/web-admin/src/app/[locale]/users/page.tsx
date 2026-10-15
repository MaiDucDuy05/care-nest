'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient, type UserAdmin } from '@/lib/api-client';
import { UserTable } from '@/components/users/user-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebounce } from '@/lib/hooks/use-debounce';

const ROLES = ['', 'USER', 'SELLER', 'ADMIN', 'SUPPORT', 'MEDICAL_REVIEWER'];
const STATUSES = ['', 'ACTIVE', 'SUSPENDED', 'PENDING'];

export default function UsersPage() {
  const t = useTranslations('users');
  const router = useRouter();
  const [data, setData] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.users.list({ page: p, limit: 50, search: debouncedSearch, role: role || undefined, status: status || undefined });
      setData(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '220px' }}
        />
        <Select
          label={t('allRoles')}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={ROLES.map((r) => ({ value: r, label: r ? t(`roles.${r}`) : t('allRoles') }))}
        />
        <Select
          label={t('allStatuses')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUSES.map((s) => ({ value: s, label: s ? t(s.toLowerCase() as 'active' | 'suspended' | 'pending') : t('allStatuses') }))}
        />
      </div>

      <UserTable
        data={data}
        loading={loading}
        onView={(item) => router.push(`/users/${item.id}`)}
        page={page}
        totalPages={totalPages}
        onPageChange={fetchData}
      />
    </div>
  );
}
