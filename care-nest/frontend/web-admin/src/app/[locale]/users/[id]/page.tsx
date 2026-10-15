'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type UserDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserActionsMenu } from '@/components/users/user-actions-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDetailPage() {
  const t = useTranslations('users');
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await apiClient.users.getById(userId, token ?? undefined);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [userId]);

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><Skeleton width="200px" height="32px" /><Skeleton width="100%" height="300px" /></div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>User not found</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{data.fullName}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{data.email}</p>
        </div>
      </div>

      <UserActionsMenu user={data} onRefresh={fetchData} />
    </div>
  );
}
