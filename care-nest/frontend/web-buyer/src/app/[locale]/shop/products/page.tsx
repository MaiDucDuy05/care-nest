import type { Metadata } from 'next';
import { Search, ShoppingCart, Star } from 'lucide-react';
import { publicCatalogService } from '@/lib/services/public-catalog.service';
import { storeListMetadata, type Locale } from '@/lib/seo';
import { Link } from '@/i18n/routing';

interface PageProps {
  params: { locale: string };
  searchParams: { search?: string; categoryId?: string; sellerId?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return storeListMetadata(params.locale as Locale);
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const locale = params.locale as Locale;
  let products: Awaited<ReturnType<typeof publicCatalogService.listProducts>>['items'] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await publicCatalogService.listProducts({
      search: searchParams.search,
      categoryId: searchParams.categoryId,
      sellerId: searchParams.sellerId,
      pageSize: 24,
    });
    products = res.items;
    total = res.total;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          {locale === 'vi' ? 'Thiết Bị Y Tế & Chăm Sóc Sức Khỏe Gia Đình' : 'Medical Devices & Home Health Care'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
          {locale === 'vi'
            ? 'Tuyển chọn các thiết bị y tế đạt chuẩn từ nhà cung cấp KYC đã xác minh.'
            : 'Curated medical devices from KYC-verified sellers.'}
        </p>
      </div>

      <form
        className="card"
        style={{ padding: '16px 20px', marginBottom: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}
        action={`/${locale}/shop/products`}
        method="get"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card-subtle)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            flex: 1,
            minWidth: '240px',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search ?? ''}
            placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm…' : 'Search products…'}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px' }}>
          {locale === 'vi' ? 'Tìm' : 'Search'}
        </button>
      </form>

      {error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>
          {locale === 'vi' ? 'Không thể tải sản phẩm. Vui lòng thử lại sau.' : 'Failed to load products. Please try again later.'}
          <div className="text-sm text-muted" style={{ marginTop: 8 }}>{error}</div>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>
          {locale === 'vi' ? 'Không có sản phẩm nào.' : 'No products found.'}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            {total} {locale === 'vi' ? 'sản phẩm' : 'products'}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({ product, locale }: { product: Awaited<ReturnType<typeof publicCatalogService.listProducts>>['items'][number]; locale: Locale }) {
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
              height: 200,
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
            }}
          />
        ) : (
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              height: '200px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
            }}
          />
        )}
      </Link>

      {product.isMedical && (
        <span className="badge badge-indigo" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
          {locale === 'vi' ? 'Y khoa' : 'Medical'}
        </span>
      )}
      {product.isIotDevice && (
        <span className="badge badge-teal" style={{ alignSelf: 'flex-start', marginBottom: '8px', marginLeft: 4 }}>
          IoT
        </span>
      )}

      {product.category && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {product.category.name}
        </div>
      )}

      <Link href={path} style={{ color: 'inherit', textDecoration: 'none' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4, flex: 1 }}>
          {product.name}
        </h2>
      </Link>

      {product.seller && (
        <Link
          href={`/shop/sellers/${product.seller.storeSlug}`}
          style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Star size={12} /> {product.seller.storeName} · {Number(product.seller.ratingAvg).toFixed(1)}
        </Link>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
          {formatVnd(product.basePrice)}
        </span>
        <Link
          href={path}
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          <ShoppingCart size={16} /> {locale === 'vi' ? 'Mua ngay' : 'Buy now'}
        </Link>
      </div>
    </div>
  );
}
