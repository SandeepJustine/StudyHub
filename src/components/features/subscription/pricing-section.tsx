'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PricingCards } from './pricing-cards';

export function PricingSection() {
  const router = useRouter();

  const handleSelectPlan = (tier: string, cycle: 'MONTHLY' | 'ANNUAL') => {
    // Store selected plan in URL params or localStorage
    const params = new URLSearchParams({
      tier,
      cycle,
    });
    router.push(`/auth/register?${params.toString()}`);
  };

  return (
    <PricingCards
      role="STUDENT"
      onSelectPlan={handleSelectPlan}
    />
  );
}