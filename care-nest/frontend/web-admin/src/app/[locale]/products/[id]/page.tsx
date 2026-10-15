'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type ProductDetailResponse } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { ProductReviewForm } from '@/components/products/product-review-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductReviewPage() {
  const t = useTranslations('products');
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { token } = useAuth();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await apiClient.products.getById(productId, token ?? undefined);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [productId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton width="200px" height="32px" />
        <Skeleton width="100%" height="200px" />
      </div>
    );
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Not found</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)', fontSize: '14px' }}>
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{t('reviewTitle')}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('reviewDesc')}</p>
        </div>
      </div>

      <ProductReviewForm data={data} onSuccess={() => router.push('/products')} />
    </div>
  );
}
