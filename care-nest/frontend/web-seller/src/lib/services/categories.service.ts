import { CATALOG_API, apiFetch } from '../api-client';

export interface CategoryRecord {
  id: string;
  name: string;
  children?: CategoryRecord[];
}

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

const MOCK_CATEGORIES: CategoryRecord[] = [
  { id: 'cat-1', name: 'Máy đo huyết áp' },
  { id: 'cat-2', name: 'Nhiệt kế' },
];

function toOptions(categories: CategoryRecord[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...toOptions(category.children ?? [], depth + 1),
  ]);
}

export const categoriesService = {
  async listForSelect(): Promise<CategoryOption[]> {
    const categories = USE_MOCK
      ? MOCK_CATEGORIES
      : await apiFetch<CategoryRecord[]>(`${CATALOG_API}/api/v1/categories`);

    return toOptions(categories);
  },
};
