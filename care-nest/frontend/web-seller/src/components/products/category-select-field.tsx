'use client';

import { useEffect, useState } from 'react';
import type { ChangeEventHandler, Ref } from 'react';
import { useTranslations } from 'next-intl';
import { categoriesService, type CategoryOption } from '@/lib/services/categories.service';

interface CategorySelectFieldProps {
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  onBlur: () => void;
  inputRef: Ref<HTMLSelectElement>;
  error?: string;
}

export function CategorySelectField({
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  error,
}: CategorySelectFieldProps) {
  const tProducts = useTranslations('products');
  const tSelect = useTranslations('products.categorySelect');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    categoriesService
      .listForSelect()
      .then((items) => {
        if (mounted) setCategories(items);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <label className="label" htmlFor={name}>{tProducts('category')}</label>
      <select
        id={name}
        className="select"
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        ref={inputRef}
        disabled={loading || loadError || categories.length === 0}
        aria-invalid={Boolean(error || loadError)}
      >
        <option value="">
          {loading
            ? tSelect('loading')
            : loadError
              ? tSelect('loadFailed')
              : categories.length === 0
                ? tSelect('empty')
                : tSelect('placeholder')}
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {`${'— '.repeat(category.depth)}${category.name}`}
          </option>
        ))}
      </select>
      {(error || loadError) && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
          {error || tSelect('loadError')}
        </p>
      )}
    </div>
  );
}
