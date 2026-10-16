/**
 * SEO metadata helpers. Centralized so every public page gets
 * consistent title/description/OG/hreflang rules.
 */

import type { Metadata } from 'next';
import type { PublicProduct, PublicSeller } from './services/public-catalog.service';

const SITE_NAME = 'CareNest';
const DEFAULT_OG = '/og-default.png';

export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function siteUrl(): string {
  // Public-facing origin. Used for canonical + OG URLs.
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://carenest.vn';
}

/**
 * Build a Metadata object for a product detail page.
 * Includes JSON-LD via `other` for `Product` + `Offer`.
 */
export function productMetadata(product: PublicProduct, locale: Locale): Metadata {
  const path = `/shop/products/${product.slug || product.id}`;
  const url = `${siteUrl()}/${locale}${path}`;
  const title = product.name;
  const description =
    product.description?.slice(0, 160) ||
    `${product.name} — ${product.seller?.storeName ?? 'CareNest'}`;
  const image = product.images[0]?.url || DEFAULT_OG;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `${siteUrl()}/${l}${path}`])
      ),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: image, alt: title }],
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    other: {
      'product:price:amount': String(product.basePrice),
      'product:price:currency': 'VND',
      'product:availability': 'in stock',
    },
  };
}

/**
 * JSON-LD structured data for a product. Render with
 * <script type="application/ld+json"> inside the page.
 */
export function productJsonLd(product: PublicProduct, locale: Locale): string {
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { '@type': 'Brand', name: product.seller?.storeName ?? SITE_NAME },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl()}/${locale}/shop/products/${product.slug || product.id}`,
      priceCurrency: 'VND',
      price: product.basePrice,
      availability: 'https://schema.org/InStock',
      seller: product.seller
        ? {
            '@type': 'Organization',
            name: product.seller.storeName,
            url: `${siteUrl()}/${locale}/shop/sellers/${product.seller.storeSlug}`,
          }
        : { '@type': 'Organization', name: SITE_NAME },
    },
  };
  return JSON.stringify(data);
}

export function sellerMetadata(seller: PublicSeller, locale: Locale): Metadata {
  const path = `/shop/sellers/${seller.storeSlug}`;
  const url = `${siteUrl()}/${locale}${path}`;
  const title = `${seller.storeName} — ${SITE_NAME}`;
  const description = `Cửa hàng ${seller.storeName} trên CareNest. Đánh giá ${seller.ratingAvg}/5 từ ${seller.ratingCount} người mua.`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `${siteUrl()}/${l}${path}`])
      ),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
    },
  };
}

export function storeListMetadata(locale: Locale): Metadata {
  const path = '/shop/products';
  const url = `${siteUrl()}/${locale}${path}`;
  return {
    title: locale === 'vi' ? 'Sản phẩm' : 'Products',
    description:
      locale === 'vi'
        ? 'Thiết bị y tế chính hãng, máy đo huyết áp, nhiệt kế, máy đo SpO2, đồng hồ IoT cho người thân.'
        : 'Authentic medical devices, blood pressure monitors, thermometers, SpO2 meters, IoT watches for your loved ones.',
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `${siteUrl()}/${l}${path}`])
      ),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: locale === 'vi' ? 'Sản phẩm' : 'Products',
      description:
        locale === 'vi'
          ? 'Thiết bị y tế chính hãng từ các nhà cung cấp được xác minh KYC.'
          : 'Authentic medical devices from KYC-verified sellers.',
      url,
    },
  };
}
