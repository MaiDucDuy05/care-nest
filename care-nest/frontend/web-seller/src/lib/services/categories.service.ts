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

function toOptions(categories: CategoryRecord[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...toOptions(category.children ?? [], depth + 1),
  ]);
}

export const categoriesService = {
  async listForSelect(): Promise<CategoryOption[]> {
    const categories = await apiFetch<CategoryRecord[]>(`${CATALOG_API}/api/v1/categories`);
    return toOptions(categories || []);
  },
};
