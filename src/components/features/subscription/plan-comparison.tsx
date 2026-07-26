'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Feature {
  name: string;
  category: string;
  values: Record<string, boolean | string>;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  cycle: string;
}

interface PlanComparisonProps {
  plans: Plan[];
  features: Feature[];
  onSelectPlan?: (planId: string) => void;
}

export function PlanComparison({ plans, features, onSelectPlan }: PlanComparisonProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Core Features']);
  const [highlightedPlan, setHighlightedPlan] = useState<string | null>(null);

  const categories = [...new Set(features.map(f => f.category))];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}>
          {/* Feature column header */}
          <div className="p-4">
            <h3 className="font-semibold text-navy">Features</h3>
          </div>

          {/* Plan headers */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 text-center rounded-t-xl transition-all ${
                highlightedPlan === plan.id ? 'bg-navy/5 ring-2 ring-navy' : 'bg-grey-light/50'
              }`}
              onMouseEnter={() => setHighlightedPlan(plan.id)}
              onMouseLeave={() => setHighlightedPlan(null)}
            >
              <h4 className="font-bold text-navy text-lg">{plan.name}</h4>
              <p className="text-2xl font-bold text-navy mt-2">
                {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
              </p>
              <p className="text-xs text-grey-medium">{plan.cycle}</p>
              {onSelectPlan && (
                <Button
                  variant={highlightedPlan === plan.id ? 'primary' : 'outline'}
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onSelectPlan(plan.id)}
                >
                  Choose Plan
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Features by Category */}
        {categories.map((category) => (
          <div key={category} className="border-t border-grey-light">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-grey-light/30 transition-colors"
            >
              <span className="font-semibold text-navy">{category}</span>
              {expandedCategories.includes(category) ? (
                <ChevronUp size={18} className="text-grey-medium" />
              ) : (
                <ChevronDown size={18} className="text-grey-medium" />
              )}
            </button>

            {expandedCategories.includes(category) && (
              <div className="pb-2">
                {features
                  .filter(f => f.category === category)
                  .map((feature, index) => (
                    <div
                      key={index}
                      className="grid gap-4 py-3 px-4 hover:bg-grey-light/20 transition-colors"
                      style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}
                    >
                      <div>
                        <p className="text-sm text-grey-dark">{feature.name}</p>
                      </div>
                      {plans.map((plan) => {
                        const value = feature.values[plan.id];
                        return (
                          <div key={plan.id} className="flex justify-center">
                            {value === true ? (
                              <Check size={18} className="text-green" />
                            ) : value === false ? (
                              <X size={18} className="text-grey-medium" />
                            ) : typeof value === 'string' ? (
                              <span className="text-sm text-grey-dark">{value}</span>
                            ) : (
                              <Minus size={18} className="text-grey-light" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}