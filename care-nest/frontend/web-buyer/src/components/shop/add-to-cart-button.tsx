'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { cartService } from '@/services/cart.service';
import type { PublicProduct } from '@/lib/services/public-catalog.service';
import type { Locale } from '@/lib/seo';

interface AddToCartButtonProps {
  product: PublicProduct;
  locale: Locale;
}

export function AddToCartButton({ product, locale }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await cartService.addItem({
        productId: product.id,
        sellerId: product.seller?.id || 'care-nest-store',
        name: product.name,
        unitPrice: product.basePrice,
        quantity: 1,
        imageUrl: product.images?.[0]?.url,
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      id="add-to-cart-btn"
      onClick={handleAdd}
      disabled={isAdding || (typeof product.stock === 'number' && product.stock <= 0)}
      className="btn btn-primary"
      style={{
        flex: 1,
        padding: '12px 18px',
        fontSize: 15,
        backgroundColor: isSuccess ? 'var(--success, #059669)' : undefined,
        borderColor: isSuccess ? 'var(--success, #059669)' : undefined,
      }}
    >
      {isAdding ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={18} className="animate-spin" />
          {locale === 'vi' ? 'Đang thêm...' : 'Adding...'}
        </span>
      ) : isSuccess ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={18} />
          {locale === 'vi' ? 'Đã thêm vào giỏ!' : 'Added to cart!'}
        </span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} />
          {locale === 'vi' ? 'Thêm vào giỏ' : 'Add to cart'}
        </span>
      )}
    </button>
  );
}
