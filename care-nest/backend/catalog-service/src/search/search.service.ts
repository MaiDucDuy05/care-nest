import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getPrismaClient, type PrismaClient } from '@carenest/database';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Meilisearch } = require('meilisearch');

export interface IndexedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  price: number;
  status: string;
  categoryId?: string | null;
  categoryName?: string;
  categorySlug?: string;
  sellerId?: string;
  sellerStoreName?: string;
  isIotDevice: boolean;
  requiresImei: boolean;
  imageUrl?: string | null;
  stock?: number;
  createdAt: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: any = null;
  private productIndex: any = null;
  private isAvailable = false;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async onModuleInit() {
    await this.initMeilisearch();
  }

  async initMeilisearch() {
    const host = process.env.MEILISEARCH_URL || 'http://localhost:7700';
    const apiKey = process.env.MEILISEARCH_MASTER_KEY || 'carenest_dev_master_key';

    try {
      this.client = new Meilisearch({ host, apiKey });
      const health = await this.client.health();

      if (health.status === 'available') {
        this.isAvailable = true;
        this.productIndex = this.client.index('products');

        // Configure index settings: searchable, filterable, sortable, typo tolerance
        await this.productIndex.updateSettings({
          searchableAttributes: [
            'name',
            'brand',
            'categoryName',
            'description',
            'sellerStoreName',
          ],
          filterableAttributes: [
            'status',
            'categoryId',
            'isIotDevice',
            'requiresImei',
            'sellerId',
            'price',
          ],
          sortableAttributes: ['price', 'createdAt'],
          rankingRules: [
            'words',
            'typo',
            'proximity',
            'attribute',
            'sort',
            'exactness',
          ],
          typoTolerance: {
            enabled: true,
            minWordSizeForTypos: {
              oneTypo: 4,
              twoTypos: 8,
            },
          },
        });

        this.logger.log(`MeiliSearch connected at ${host} (index 'products' ready)`);

        // Check if index is empty, if so, run initial sync in background
        const stats = await this.productIndex.getStats();
        if (stats.numberOfDocuments === 0) {
          this.logger.log('MeiliSearch products index is empty. Running initial sync...');
          this.syncAllProducts().catch((err) =>
            this.logger.warn(`Initial sync error: ${err.message}`),
          );
        }
      }
    } catch (err: any) {
      this.isAvailable = false;
      this.logger.warn(
        `MeiliSearch is not reachable at ${host} (${err.message}). Catalog search will fallback to PostgreSQL.`,
      );
    }
  }

  getStatus() {
    return {
      available: this.isAvailable,
      host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
    };
  }

  formatDocument(product: any): IndexedProduct {
    const images = Array.isArray(product.images) ? product.images : [];
    const firstImg = images.find((i: any) => i.isPrimary) || images[0];
    const imageUrl = firstImg ? (typeof firstImg === 'string' ? firstImg : firstImg.url) : null;
    const inventory = Array.isArray(product.inventory) ? product.inventory : [];
    const stock = inventory.reduce(
      (sum: number, inv: any) => sum + (Number(inv.quantity || 0) - Number(inv.reserved || 0)),
      0,
    );

    const price = Number(product.basePrice ?? product.price ?? 0);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug || product.id,
      description: product.description || '',
      brand: product.brand || '',
      price,
      status: product.status || 'ACTIVE',
      categoryId: product.categoryId || null,
      categoryName: product.category?.name || '',
      categorySlug: product.category?.slug || '',
      sellerId: product.sellerId || '',
      sellerStoreName: product.seller?.storeName || '',
      isIotDevice: Boolean(product.isIotDevice),
      requiresImei: Boolean(product.requiresImei),
      imageUrl,
      stock,
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.getTime()
          : typeof product.createdAt === 'string'
          ? new Date(product.createdAt).getTime()
          : Date.now(),
    };
  }

  async indexProduct(product: any) {
    if (!this.isAvailable || !this.productIndex) return;
    try {
      let fullProduct = product;
      // Load full relations if not present
      if (!product.category || !product.images || !product.seller || !product.inventory) {
        fullProduct = await this.prisma.product.findUnique({
          where: { id: product.id },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: { select: { id: true, storeName: true } },
            images: { orderBy: { position: 'asc' } },
            inventory: { select: { quantity: true, reserved: true } },
          },
        });
      }

      // Only ACTIVE and non-deleted products belong in buyer search index
      if (!fullProduct || fullProduct.deletedAt || fullProduct.status !== 'ACTIVE') {
        await this.deleteProduct(product.id);
        return;
      }

      const doc = this.formatDocument(fullProduct);
      await this.productIndex.addDocuments([doc], { primaryKey: 'id' });
    } catch (err: any) {
      this.logger.warn(`Failed to index product ${product.id}: ${err.message}`);
    }
  }

  async deleteProduct(productId: string) {
    if (!this.isAvailable || !this.productIndex) return;
    try {
      await this.productIndex.deleteDocument(productId);
    } catch (err: any) {
      this.logger.warn(`Failed to delete product ${productId} from index: ${err.message}`);
    }
  }

  async syncAllProducts(): Promise<{ count: number }> {
    if (!this.isAvailable || !this.productIndex) {
      throw new Error('MeiliSearch is not available');
    }

    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, storeName: true } },
        images: { orderBy: { position: 'asc' } },
        inventory: { select: { quantity: true, reserved: true } },
      },
    });

    const docs = products.map((p) => this.formatDocument(p));
    if (docs.length > 0) {
      await this.productIndex.addDocuments(docs, { primaryKey: 'id' });
    }
    this.logger.log(`Synced ${docs.length} products to MeiliSearch.`);
    return { count: docs.length };
  }

  async searchProducts(
    q: string,
    options?: {
      page?: number;
      pageSize?: number;
      categoryId?: string;
      isIotDevice?: boolean;
    },
  ): Promise<{ items: any[]; total: number } | null> {
    if (!this.isAvailable || !this.productIndex) {
      return null;
    }

    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      const filters: string[] = ['status = "ACTIVE"'];
      if (options?.categoryId) {
        filters.push(`categoryId = "${options.categoryId}"`);
      }
      if (options?.isIotDevice !== undefined) {
        filters.push(`isIotDevice = ${options.isIotDevice}`);
      }

      const res = await this.productIndex.search(q, {
        limit: pageSize,
        offset,
        filter: filters.join(' AND '),
      });

      // Format hits into standard product shape expected by frontend
      const items = res.hits.map((h: any) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        description: h.description,
        price: h.price,
        basePrice: h.price,
        status: h.status,
        categoryId: h.categoryId,
        category: h.categoryName ? { id: h.categoryId, name: h.categoryName, slug: h.categorySlug } : null,
        sellerId: h.sellerId,
        seller: h.sellerStoreName ? { id: h.sellerId, storeName: h.sellerStoreName } : null,
        isIotDevice: h.isIotDevice,
        requiresImei: h.requiresImei,
        images: h.imageUrl ? [{ url: h.imageUrl, isPrimary: true }] : [],
        stock: h.stock,
        createdAt: new Date(h.createdAt).toISOString(),
      }));

      return {
        items,
        total: res.estimatedTotalHits || res.hits.length,
      };
    } catch (err: any) {
      this.logger.warn(`MeiliSearch search failed (${err.message}). Falling back to DB.`);
      return null;
    }
  }

  async suggest(
    q: string,
    limit = 6,
  ): Promise<{ products: any[]; keywords: string[] }> {
    const defaultResponse = { products: [], keywords: [] };
    if (!q || !q.trim()) return defaultResponse;

    const queryLower = q.trim().toLowerCase();
    const keywordSet = new Set<string>();

    const POPULAR_KEYWORDS = [
      'Đồng hồ định vị SOS',
      'Máy đo huyết áp Omron',
      'Máy đo đường huyết',
      'Gậy thông minh cảnh báo ngã',
      'Máy tạo oxy & SpO2',
      'Cảm biến radar giám sát giấc ngủ',
      'Nút bấm cấp cứu SOS',
    ];

    for (const kw of POPULAR_KEYWORDS) {
      if (kw.toLowerCase().includes(queryLower)) {
        keywordSet.add(kw);
      }
    }

    if (!this.isAvailable || !this.productIndex) {
      // Fallback to PostgreSQL
      const dbProducts = await this.prisma.product.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          name: { contains: q.trim(), mode: 'insensitive' },
        },
        take: limit,
        include: {
          category: { select: { name: true } },
          images: { take: 1, select: { url: true } },
        },
      });

      for (const p of dbProducts) {
        if (p.category?.name) keywordSet.add(p.category.name);
      }

      return {
        products: dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.basePrice || 0),
          categoryName: p.category?.name || '',
          imageUrl: p.images[0]?.url || null,
        })),
        keywords: Array.from(keywordSet).slice(0, 4),
      };
    }

    try {
      const res = await this.productIndex.search(q.trim(), {
        limit,
        filter: 'status = "ACTIVE"',
        attributesToRetrieve: ['id', 'name', 'slug', 'price', 'categoryName', 'imageUrl', 'brand'],
      });

      for (const hit of res.hits) {
        if (hit.categoryName && !keywordSet.has(hit.categoryName)) {
          keywordSet.add(hit.categoryName);
        }
        if (hit.brand && !keywordSet.has(hit.brand)) {
          keywordSet.add(hit.brand);
        }
      }

      return {
        products: res.hits,
        keywords: Array.from(keywordSet).slice(0, 4),
      };
    } catch (err: any) {
      this.logger.warn(`Suggest error: ${err.message}`);
      return defaultResponse;
    }
  }
}
