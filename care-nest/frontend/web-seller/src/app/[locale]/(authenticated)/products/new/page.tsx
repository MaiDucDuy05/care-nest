'use client';

import { useState } from 'react';
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

const schema = z.object({
  name: z.string().min(2, 'Bắt buộc'),
  description: z.string().optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).default([]),
  sku: z.string().min(2, 'Bắt buộc'),
  priceVnd: z.coerce.number().min(0, 'Giá phải >= 0'),
  categoryId: z.string().min(1, 'Bắt buộc'),
  stock: z.coerce.number().int().min(0, 'Tồn kho phải >= 0'),
  requiresImei: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0, priceVnd: 0, requiresImei: true, images: [] },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitError(null);
      await productsService.create(data);
      router.replace('/products');
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link href="/products" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> {tCommon('back')}
      </Link>
      <h1 className="text-h2">{t('create.title')}</h1>

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
            <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              {t('pendingReview')}
            </div>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>{t('reviewRequired')}</p>
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
            {isSubmitting ? <span className="spinner" /> : t('create.submit')}
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
