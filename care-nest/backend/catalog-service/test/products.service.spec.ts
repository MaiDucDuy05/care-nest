import { describe, it, expect } from 'vitest';
import { ProductsService } from '../src/products/products.service.js';

describe('ProductsService', () => {
  it('should be defined', () => {
    const mockRepo = {} as any;
    const service = new ProductsService(mockRepo);
    expect(service).toBeDefined();
  });
});
