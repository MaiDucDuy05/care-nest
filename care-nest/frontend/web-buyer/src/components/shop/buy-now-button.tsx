'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Zap, Loader2 } from 'lucide-react';
import { cartService, emitCartUpdated } from '@/services/cart.service';
import { getToken } from '@/lib/api-client';
import type { PublicProduct } from '@/lib/services/public-catalog.service';
import type { Locale } from '@/lib/seo';

export function BuyNowButton({ product, locale }: { product: PublicProduct; locale: Locale }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBuyNow = async () => {
    setIsLoading(true);
    try {
      const updatedCart = await cartService.addItem({
        productId: product.id,
        sellerId: product.seller?.id || 'care-nest-store',
        name: product.name,
        unitPrice: product.basePrice,
        quantity: 1,
        imageUrl: product.images?.[0]?.url,
      });
      emitCartUpdated(updatedCart);

      const token = getToken();
      if (!token) {
        // Chưa đăng nhập: Bắt buộc đăng nhập trước khi mua hàng
        router.push('/auth/login?redirect=/shop/cart');
      } else {
        // Đã đăng nhập: Chuyển thẳng vào giỏ hàng để đặt hàng ngay
        router.push('/shop/cart');
      }
    } catch (err) {
      console.error('Lỗi mua ngay:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      id={`buy-now-btn-${product.id}`}
      onClick={handleBuyNow}
      disabled={isLoading || (typeof product.stock === 'number' && product.stock <= 0)}
      className="btn"
      style={{
        flex: 1,
        padding: '12px 18px',
        fontSize: 15,
        backgroundColor: '#ea580c',
        borderColor: '#c2410c',
        color: '#ffffff',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
      }}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Loader2 size={18} className="animate-spin" />
          {locale === 'vi' ? 'Đang xử lý...' : 'Processing...'}
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Zap size={18} />
          {locale === 'vi' ? 'Mua ngay' : 'Buy now'}
        </span>
      )}
    </button>
  );
}

