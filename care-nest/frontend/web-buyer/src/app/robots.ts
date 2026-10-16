import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

/**
 * robots.txt: allow public routes, disallow auth/health/settings.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/vi/', '/en/', '/vi/shop/', '/en/shop/'],
        disallow: ['/vi/auth/', '/en/auth/', '/vi/health/', '/en/health/', '/vi/settings/', '/en/settings/', '/vi/subscription/', '/en/subscription/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
