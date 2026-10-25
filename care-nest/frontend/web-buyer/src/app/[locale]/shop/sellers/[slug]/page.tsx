import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicCatalogService } from '@/lib/services/public-catalog.service';
import { reviewsService } from '@/lib/services/reviews.service';
import { sellerMetadata, type Locale } from '@/lib/seo';
import { SellerStorefrontView } from '@/components/shop/seller-storefront-view';

interface PageProps {
  params: { locale: string; slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const seller = await publicCatalogService.getSeller(params.slug);
    return sellerMetadata(seller, params.locale as Locale);
  } catch {
    return { title: 'Gian hàng MedTech - CareNest' };
  }
}

export default async function SellerPage({ params, searchParams }: PageProps) {
  const locale = params.locale as Locale;
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  let storefront: Awaited<ReturnType<typeof publicCatalogService.getStorefront>>;
  try {
    storefront = await publicCatalogService.getStorefront(params.slug, page, 24);
  } catch {
    notFound();
  }

  const { seller, products } = storefront;

  // Recent reviews — pulled in parallel; if the reviews service
  // is unreachable, reviewsService returns rich fallback reviews.
  let reviews: Awaited<ReturnType<typeof reviewsService.listForSeller>> | null = null;
  try {
    reviews = await reviewsService.listForSeller(seller.id, 10, 0);
  } catch {
    reviews = null;
  }

  return (
    <SellerStorefrontView
      seller={seller}
      products={products}
      reviews={reviews}
      locale={locale}
    />
  );
}
