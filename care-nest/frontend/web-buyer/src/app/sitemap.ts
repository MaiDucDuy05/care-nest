import type { MetadataRoute } from 'next';
import { publicCatalogService } from '@/lib/services/public-catalog.service';
import { siteUrl, SUPPORTED_LOCALES } from '@/lib/seo';

/**
 * Dynamic sitemap. Lists:
 *  - 2 homepage entries (vi + en) with hreflang
 *  - 2 product list entries (vi + en)
 *  - One entry per public product (with hreflang alternates)
 *  - One entry per public seller (with hreflang alternates)
 *
 * Auth/settings/health routes are intentionally NOT included —
 * Google should not index them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of SUPPORTED_LOCALES) {
    staticEntries.push({
      url: `${base}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `${base}/${l}`])),
      },
    });
    staticEntries.push({
      url: `${base}/${locale}/shop/products`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          SUPPORTED_LOCALES.map((l) => [l, `${base}/${l}/shop/products`])
        ),
      },
    });
  }

  // Dynamic product entries
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await publicCatalogService.sitemapProducts();
    productEntries = products.map((p) => {
      const url = `${base}/vi/shop/products/${p.id}`;
      return {
        url,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${base}/${l}/shop/products/${p.id}`])
          ),
        },
      };
    });
  } catch {
    // Sitemap generation is best-effort; if catalog is down, ship static only
  }

  // Dynamic seller entries
  let sellerEntries: MetadataRoute.Sitemap = [];
  try {
    const sellers = await publicCatalogService.sitemapSellers();
    sellerEntries = sellers.map((s) => {
      const url = `${base}/vi/shop/sellers/${s.slug}`;
      return {
        url,
        lastModified: new Date(s.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((l) => [l, `${base}/${l}/shop/sellers/${s.slug}`])
          ),
        },
      };
    });
  } catch {
    // best-effort
  }

  return [...staticEntries, ...productEntries, ...sellerEntries];
}
