/**
 * Catalog service — product browsing.
 */
import { apiClient } from '../lib/api-client';

export const catalogService = {
  async getProducts(params?: { categoryId?: string; search?: string; page?: number }) {
    return apiClient.catalog.getProducts(params);
  },

  async getProduct(id: string) {
    return apiClient.catalog.getProduct(id);
  },
};
