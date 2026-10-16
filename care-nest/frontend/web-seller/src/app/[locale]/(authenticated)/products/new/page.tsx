'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productsService } from '@/lib/services/products.service';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

const schema = z.object({
  name: z.string().min(2, 'Bắt buộc'),
  description: z.string().optional(),
  sku: z.string().min(2, 'Bắt buộc'),
  priceVnd: z.coerce.number().min(0, 'Giá phải >= 0'),
  categoryId: z.string().min(1, 'Bắt buộc'),
  stock: z.coerce.number().int().min(0, 'Tồn kho phải >= 0'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  requiresImei: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'DRAFT', stock: 0, priceVnd: 0, requiresImei: true },
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
        <div>
          <label className="label">{t('create.description')}</label>
          <textarea className="textarea" {...register('description')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label={t('sku')} reg={register('sku')} err={errors.sku} />
          <Field label={t('category')} reg={register('categoryId')} err={errors.categoryId} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field label={t('price')} reg={register('priceVnd')} err={errors.priceVnd} type="number" />
          <Field label={t('stock')} reg={register('stock')} err={errors.stock} type="number" />
          <div>
            <label className="label">{t('status')}</label>
            <select className="select" {...register('status')}>
              <option value="DRAFT">{t('draft')}</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="INACTIVE">{t('inactive')}</option>
            </select>
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
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
