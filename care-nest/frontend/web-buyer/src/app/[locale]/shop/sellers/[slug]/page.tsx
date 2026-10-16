import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Star, Shield, ShoppingCart, ChevronLeft, MapPin, BadgeCheck } from 'lucide-react';
import { publicCatalogService } from '@/lib/services/public-catalog.service';
import { sellerMetadata, type Locale } from '@/lib/seo';
import { Link } from '@/i18n/routing';

interface PageProps {
  params: { locale: string; slug: string };
  searchParams: { page?: string };
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const seller = await publicCatalogService.getSeller(params.slug);
    return sellerMetadata(seller, params.locale as Locale);
  } catch {
    return { title: 'Not found' };
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

  const { seller, products, total, hasMore } = storefront;

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      <Link href="/shop/products" className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        <ChevronLeft size={16} /> {locale === 'vi' ? 'Tất cả sản phẩm' : 'All products'}
      </Link>

      <header
        className="card"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 24,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: 36,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {seller.storeName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {seller.storeName}
            <BadgeCheck size={20} color="var(--success, #047857)" />
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
            {locale === 'vi' ? 'Thành viên từ' : 'Member since'} {new Date(seller.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <Star size={16} fill="currentColor" color="var(--warning, #d97706)" />
              {seller.ratingAvg.toFixed(1)}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>
                ({seller.ratingCount} {locale === 'vi' ? 'đánh giá' : 'reviews'})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success, #047857)' }}>
              <Shield size={14} /> {locale === 'vi' ? 'KYC đã xác minh' : 'KYC verified'}
            </div>
          </div>
        </div>
      </header>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        {locale === 'vi' ? 'Sản phẩm' : 'Products'} ({total})
      </h2>

      {products.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>
          {locale === 'vi' ? 'Cửa hàng chưa có sản phẩm nào.' : 'This store has no products yet.'}
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 20,
            }}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href={`/shop/sellers/${seller.storeSlug}?page=${page + 1}`} className="btn btn-secondary">
                {locale === 'vi' ? 'Xem thêm' : 'Load more'}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product, locale }: { product: any; locale: Locale }) {
  const path = `/shop/products/${product.slug || product.id}`;
  const image = product.images[0]?.url;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <Link href={path} style={{ display: 'block' }}>
        {image ? (
          <img
            src={image}
            alt={product.images[0]?.alt ?? product.name}
            style={{
              width: '100%',
              height: 180,
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
            }}
          />
        ) : (
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              height: 180,
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
            }}
          />
        )}
      </Link>
      <Link href={path} style={{ color: 'inherit', textDecoration: 'none' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{product.name}</h3>
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{formatVnd(product.basePrice)}</span>
        <Link href={path} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
          <ShoppingCart size={14} />
        </Link>
      </div>
    </div>
  );
}
