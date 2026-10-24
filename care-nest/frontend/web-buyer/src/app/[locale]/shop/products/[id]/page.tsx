import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Star, Shield, MessageCircle, ChevronLeft } from 'lucide-react';
import { publicCatalogService } from '@/lib/services/public-catalog.service';
import { productMetadata, productJsonLd, type Locale } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';
import { BuyNowButton } from '@/components/shop/buy-now-button';

interface PageProps {
  params: { locale: string; id: string };
}

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await publicCatalogService.getProduct(params.id);
    return productMetadata(product, params.locale as Locale);
  } catch {
    return { title: 'Not found' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  let product: Awaited<ReturnType<typeof publicCatalogService.getProduct>>;
  try {
    product = await publicCatalogService.getProduct(params.id);
  } catch {
    notFound();
  }

  const locale = params.locale as Locale;
  const jsonLd = productJsonLd(product, locale);
  const mainImage = product.images[0]?.url;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
        <Link href="/shop/products" className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <ChevronLeft size={16} /> {locale === 'vi' ? 'Quay lại' : 'Back'}
        </Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 32,
          }}
        >
          <div>
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card-subtle)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
            )}

            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {product.images.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={img.alt ?? product.name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.isMedical && <span className="badge badge-indigo">{locale === 'vi' ? 'Y khoa' : 'Medical'}</span>}
              {product.isIotDevice && <span className="badge badge-teal">IoT</span>}
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {product.name}
            </h1>

            {product.seller && (
              <Link
                href={`/shop/sellers/${product.seller.storeSlug}`}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Shield size={20} color="var(--success, #047857)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{product.seller.storeName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {locale === 'vi' ? 'Nhà cung cấp KYC đã xác minh' : 'KYC-verified seller'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600 }}>
                  <Star size={14} fill="currentColor" />
                  {Number(product.seller.ratingAvg).toFixed(1)}
                </div>
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>
                {formatVnd(product.basePrice)}
              </div>
              {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                <div style={{ fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatVnd(product.compareAtPrice)}
                </div>
              )}
            </div>

            {typeof product.stock === 'number' && (
              <div style={{ color: product.stock > 0 ? 'var(--success, #047857)' : 'var(--danger)' }}>
                {product.stock > 0
                  ? `${locale === 'vi' ? 'Còn hàng' : 'In stock'} (${product.stock})`
                  : locale === 'vi'
                  ? 'Hết hàng'
                  : 'Out of stock'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <AddToCartButton product={product} locale={locale} />
              <BuyNowButton product={product} locale={locale} />
              <button className="btn btn-secondary" style={{ padding: '12px 18px' }} title="Tư vấn y tế">
                <MessageCircle size={18} />
              </button>
            </div>

            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>
                {locale === 'vi' ? 'Cam kết của CareNest' : 'CareNest guarantee'}
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8 }}>
                <li>{locale === 'vi' ? 'Chính hãng — hoàn tiền 200% nếu phát hiện hàng giả' : 'Authentic — 200% refund if counterfeit'}</li>
                <li>{locale === 'vi' ? 'Bảo hành 12-24 tháng tùy sản phẩm' : '12-24 month warranty'}</li>
                <li>{locale === 'vi' ? 'Đổi trả trong 7 ngày' : '7-day return policy'}</li>
                <li>{locale === 'vi' ? 'Hỗ trợ kết nối CareNest IoT' : 'CareNest IoT integration support'}</li>
              </ul>
            </div>
          </div>
        </div>

        {product.description && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              {locale === 'vi' ? 'Mô tả sản phẩm' : 'Description'}
            </h2>
            <div
              className="card"
              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-main)' }}
            >
              {product.description}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
