'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { reviewsService } from '@/lib/services/reviews.service';
import { Link } from '@/i18n/routing';

export default function ReviewPage() {
  const t = useTranslations('review');
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Read token from localStorage so we can tell buyers to log in.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem('buyer_token')) {
      router.replace('/auth/login');
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t('ratingRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewsService.create({ orderId, rating, comment: comment.trim() || undefined });
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container" style={{ maxWidth: 480, padding: '40px 16px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <h1 className="text-h2" style={{ marginBottom: 12 }}>{t('thanks')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('thanksBody')}</p>
          <Link href="/shop/products" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            {t('backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480, padding: '40px 16px' }}>
      <h1 className="text-h2" style={{ marginBottom: 8 }}>{t('title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        {t('subtitle')}
      </p>

      <form onSubmit={onSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="text-sm" style={{ display: 'block', marginBottom: 8 }}>{t('rating')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Star
                  size={32}
                  fill={n <= rating ? 'var(--warning, #d97706)' : 'transparent'}
                  color="var(--warning, #d97706)"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="text-sm" style={{ display: 'block', marginBottom: 8 }}>
            {t('comment')}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t('commentPlaceholder')}
            className="input"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {error && (
          <div role="alert" style={{ color: 'var(--danger, #dc2626)', fontSize: 14 }}>{error}</div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '…' : t('submit')}
        </button>
      </form>
    </div>
  );
}
