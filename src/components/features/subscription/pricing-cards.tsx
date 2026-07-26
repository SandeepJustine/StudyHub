'use client';
import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { PRICING_TIERS } from '@/lib/billing/pricing-tiers';
import { formatCurrency } from '@/utils/formatters';

interface PricingCardsProps {
  role: 'STUDENT' | 'SCHOOL_ADMIN' | 'INSTRUCTOR';
  currentTier?: string;
  onSelectPlan: (tier: string, cycle: 'MONTHLY' | 'ANNUAL') => void;
}

export function PricingCards({ role, currentTier, onSelectPlan }: PricingCardsProps) {
  const [cycle, setCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const getTiersForRole = () => {
    switch (role) {
      case 'STUDENT':
        return ['STUDENT_BASIC', 'STUDENT_PREMIUM', 'STUDENT_ANNUAL'];
      case 'SCHOOL_ADMIN':
        return ['INSTITUTION_BRONZE', 'INSTITUTION_SILVER', 'INSTITUTION_GOLD'];
      case 'INSTRUCTOR':
        return ['INSTRUCTOR_FREE', 'INSTRUCTOR_PRO'];
      default:
        return [];
    }
  };

  const tiers = getTiersForRole();

  return (
    <div className="space-y-8">
      {/* Cycle Toggle (only for student plans) */}
      {role === 'STUDENT' && (
        <div className="flex justify-center">
          <div className="bg-grey-light rounded-lg p-1 inline-flex">
            <button
              onClick={() => setCycle('MONTHLY')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                cycle === 'MONTHLY' ? 'bg-white shadow text-navy' : 'text-grey-dark'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('ANNUAL')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                cycle === 'ANNUAL' ? 'bg-white shadow text-navy' : 'text-grey-dark'
              }`}
            >
              Annual
              <Badge variant="success" size="sm" className="ml-2">Save 58%</Badge>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((tierKey, index) => {
          const tier = PRICING_TIERS[tierKey];
          const price = cycle === 'MONTHLY' ? tier.monthlyPrice : tier.annualPrice;
          const isCurrent = tierKey === currentTier;
          const isPopular = index === 1; // Middle tier is popular

          return (
            <Card
              key={tierKey}
              padding="lg"
              className={`relative ${
                isPopular ? 'ring-2 ring-red scale-105' : ''
              } ${isCurrent ? 'ring-2 ring-green' : ''}`}
            >
              {isPopular && (
                <Badge variant="error" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              {isCurrent && (
                <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Current Plan
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-navy">{tier.name}</h3>
                <p className="text-sm text-grey-medium mt-1">{tier.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-navy">
                    {price ? formatCurrency(price) : 'Free'}
                  </span>
                  {price && (
                    <span className="text-grey-medium text-sm">
                      {cycle === 'MONTHLY' ? '/month' : '/year'}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-green mt-0.5 flex-shrink-0" />
                    <span className="text-grey-dark">
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isPopular ? 'primary' : 'outline'}
                fullWidth
                size="lg"
                onClick={() => onSelectPlan(tierKey, cycle)}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : price === 0 ? 'Get Started Free' : 'Choose Plan'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}