'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PlanCard } from '@/components/subscription/plan-card';
import { ProrationPreview } from '@/components/subscription/proration-preview';
import { subscriptionsService } from '@/services/subscriptions.service';
import { plansService } from '@/services/plans.service';
import type { Plan } from '@carenest/shared-types';
import type { Subscription } from '@carenest/shared-types';

export default function UpgradePage() {
  const t = useTranslations('subscription.upgrade');
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pl, sub] = await Promise.all([
          plansService.getPlans(),
          subscriptionsService.getMySubscription(),
        ]);
        setPlans(pl.filter((p: Plan) => p.isActive));
        setCurrentSub(sub);
        // Default to first non-current plan
        if (sub) {
          const next = pl.find((p: Plan) => p.id !== sub.planId);
          if (next) setSelectedPlanId(next.id);
        }
      } catch {
        // handle silently
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSwitch = async () => {
    if (!selectedPlanId) return;
    setIsSwitching(true);
    try {
      await subscriptionsService.switchPlan(selectedPlanId);
      router.push('/subscription');
    } catch {
      // Handle error
    } finally {
      setIsSwitching(false);
    }
  };

  const isUpgrade = currentSub
    ? (plans.find((p) => p.id === selectedPlanId)?.priceVnd ?? 0) >
      (plans.find((p) => p.id === currentSub.planId)?.priceVnd ?? 0)
    : true;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> {t('back')}
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('subtitle')}</p>
      </div>

      {/* Plan Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentSub?.planId === plan.id}
            isSelected={selectedPlanId === plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </div>

      {/* Proration Preview */}
      {selectedPlanId && currentSub && (
        <ProrationPreview
          fromPlanId={currentSub.planId}
          toPlanId={selectedPlanId}
          onConfirm={handleSwitch}
          isLoading={isSwitching}
        />
      )}
    </div>
  );
}
