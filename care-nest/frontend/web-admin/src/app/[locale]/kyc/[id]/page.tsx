'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type KycDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { KycReviewForm } from '@/components/kyc/kyc-review-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function KycReviewPage() {
  const t = useTranslations('kyc');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<KycDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await apiClient.kyc.getById(sellerId, token ?? undefined);
      // Lock when admin opens review
      apiClient.kyc.lock(sellerId, token ?? undefined).catch(() => {});
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [sellerId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton width="200px" height="32px" />
        <Skeleton width="100%" height="200px" />
        <Skeleton width="100%" height="100px" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        Not found
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button variant="ghost" onClick={() => router.back()}>← {tCommon('back')}</Button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{t('reviewTitle', { name: data.seller.fullName })}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('reviewDesc')}</p>
        </div>
      </div>

      <KycReviewForm data={data} onSuccess={() => router.push('/kyc')} />
    </div>
  );
}
