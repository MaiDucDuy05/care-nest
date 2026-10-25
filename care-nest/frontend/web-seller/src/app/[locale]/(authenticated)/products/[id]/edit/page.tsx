'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productsService } from '@/lib/services/products.service';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { CategorySelectField } from '@/components/products/category-select-field';
import { ProductImageUploader } from '@/components/products/product-image-uploader';
import type { ProductStatus } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).default([]),
  sku: z.string().min(2),
  priceVnd: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED']),
  requiresImei: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export default function EditProductPage({ params }: { params: { id: string } }) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<ProductStatus>('PENDING_REVIEW');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await productsService.getById(params.id);
        if (!mounted) return;
        setOriginalStatus(p.status);
        reset({
          name: p.name,
          description: p.description,
          brand: p.brand ?? '',
          images: p.images ?? [],
          sku: p.sku,
          priceVnd: p.priceVnd,
          categoryId: p.categoryId,
          stock: p.stock,
          status: p.status,
          requiresImei: p.requiresImei ?? false,
        });
      } catch (err) {
        if (mounted) setSubmitError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitError(null);
      await productsService.update(params.id, data);
      router.replace('/products');
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        <div className="spinner" /> {tCommon('loading')}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link href="/products" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> {tCommon('back')}
      </Link>
      <h1 className="text-h2">{t('edit.title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label={t('name')} reg={register('name')} err={errors.name} />
        <Field label={t('brand')} reg={register('brand')} err={errors.brand} />
        <div>
          <label className="label">{t('create.description')}</label>
          <textarea className="textarea" {...register('description')} />
        </div>
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ProductImageUploader
              value={field.value ?? []}
              onChange={field.onChange}
              label={t('images')}
              selectImagesText={t('selectImages')}
              help={t('imageUploadHelp')}
              uploadingText={t('uploadingImages')}
              uploadFailedText={t('imageUploadFailed')}
              maxImagesText={t('maxProductImages')}
              removeImageText={t('removeImage')}
              onUploadingChange={setIsUploadingImages}
            />
          )}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label={t('sku')} reg={register('sku')} err={errors.sku} />
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategorySelectField
                {...field}
                value={field.value}
                inputRef={field.ref}
                error={errors.categoryId?.message}
              />
            )}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field label={t('price')} reg={register('priceVnd')} err={errors.priceVnd} type="number" />
          <Field label={t('stock')} reg={register('stock')} err={errors.stock} type="number" />
          <div>
            <label className="label">{t('status')}</label>
            <select className="select" {...register('status')}>
              <option value="PENDING_REVIEW">{t('pendingReview')}</option>
              <option value="DRAFT">{t('draft')}</option>
              <option value="ACTIVE" disabled={originalStatus !== 'ACTIVE'}>{t('active')}</option>
              <option value="INACTIVE">{t('inactive')}</option>
              {originalStatus === 'REJECTED' && <option value="REJECTED" disabled>{t('rejected')}</option>}
            </select>
            {originalStatus !== 'ACTIVE' && (
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>{t('reviewRequired')}</p>
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: 12,
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <input type="checkbox" {...register('requiresImei')} />
            <div>
              <div style={{ fontWeight: 500 }}>Sản phẩm yêu cầu IMEI</div>
              <div className="text-sm text-muted">
                Bật cho thiết bị điện tử (máy đo huyết áp, nhiệt kế, ...). Tắt cho phụ kiện / vật tư tiêu hao.
              </div>
            </div>
          </label>
        </div>

        {submitError && (
          <div
            style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: 8,
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploadingImages}>
            {isSubmitting ? <span className="spinner" /> : t('edit.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  reg,
  err,
  type = 'text',
}: {
  label: string;
  reg: ReturnType<ReturnType<typeof useForm>['register']>;
  err?: { message?: string };
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} {...reg} />
      {err?.message && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{err.message}</p>
      )}
    </div>
  );
}
