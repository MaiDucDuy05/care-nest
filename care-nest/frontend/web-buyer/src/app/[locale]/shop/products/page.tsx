import type { Metadata } from 'next';
import { ShoppingCart, Star } from 'lucide-react';
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

const FALLBACK_PRODUCTS = [
  {
    id: 'p-wonlex-v32',
    name: 'Đồng Hồ Định Vị & Cảnh Báo Té Ngã SOS Wonlex V3.2',
    slug: 'dong-ho-dinh-vi-wonlex-v32',
    basePrice: 2490000,
    compareAtPrice: 3550000,
    images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', alt: 'Wonlex V3.2' }],
    category: { id: 'c-iot', name: 'Thiết Bị Giám Sát IoT', slug: 'iot' },
    seller: { id: 'care-nest-store', storeName: 'CareNest Official Medical Store', storeSlug: 'carenest-official', ratingAvg: 4.9 },
    isMedical: true,
    isIotDevice: true,
    status: 'ACTIVE' as const,
  },
  {
    id: 'p-omron-hem7120',
    name: 'Máy Đo Huyết Áp Bắp Tay Điện Tử Omron HEM-7120',
    slug: 'may-do-huyet-ap-omron-hem-7120',
    basePrice: 850000,
    compareAtPrice: 1150000,
    images: [{ url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80', alt: 'Omron HEM-7120' }],
    category: { id: 'c-bp', name: 'Máy Đo Huyết Áp', slug: 'huyet-ap' },
    seller: { id: 'care-nest-store', storeName: 'CareNest Official Medical Store', storeSlug: 'carenest-official', ratingAvg: 4.9 },
    isMedical: true,
    isIotDevice: false,
    status: 'ACTIVE' as const,
  },
  {
    id: 'p-yuwell-7f5d',
    name: 'Máy Tạo Oxy Y Tế Gia Đình Yuwell 7F-5D (5 Lít/Phút)',
    slug: 'may-tao-oxy-yuwell-7f-5d',
    basePrice: 8900000,
    compareAtPrice: 10500000,
    images: [{ url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80', alt: 'Yuwell 7F-5D' }],
    category: { id: 'c-oxy', name: 'Máy Tạo Oxy & SpO2', slug: 'oxy' },
    seller: { id: 'care-nest-store', storeName: 'CareNest Official Medical Store', storeSlug: 'carenest-official', ratingAvg: 4.8 },
    isMedical: true,
    isIotDevice: false,
    status: 'ACTIVE' as const,
  },
  {
    id: 'p-accu-chek-active',
    name: 'Máy Đo Đường Huyết Accu-Chek Active (Kèm 50 Que Thử)',
    slug: 'may-do-duong-huyet-accu-chek-active',
    basePrice: 1090000,
    compareAtPrice: 1350000,
    images: [{ url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=80', alt: 'Accu-Chek Active' }],
    category: { id: 'c-glu', name: 'Máy Đo Đường Huyết', slug: 'duong-huyet' },
    seller: { id: 'care-nest-store', storeName: 'CareNest Official Medical Store', storeSlug: 'carenest-official', ratingAvg: 4.9 },
    isMedical: true,
    isIotDevice: false,
    status: 'ACTIVE' as const,
  },
];

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const locale = params.locale as Locale;
  let products: Awaited<ReturnType<typeof publicCatalogService.listProducts>>['items'] = [];
  let total = 0;

  try {
    const res = await publicCatalogService.listProducts({
      search: searchParams.search,
      categoryId: searchParams.categoryId,
      sellerId: searchParams.sellerId,
      pageSize: 24,
    });
    products = res.items || [];
    total = res.total || 0;
  } catch {
    // Dự phòng hiển thị sản phẩm y tế chọn lọc khi Catalog Service chưa bật
    products = FALLBACK_PRODUCTS;
    total = FALLBACK_PRODUCTS.length;
  }

  if (products.length === 0) {
    products = FALLBACK_PRODUCTS;
    total = FALLBACK_PRODUCTS.length;
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

      {products.length === 0 ? (
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
