'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { PRICING_TIERS } from '@/lib/billing/pricing-tiers';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';

interface SubscriptionFormProps {
  currentTier?: string;
  onSubscribe: (tier: string, cycle: 'MONTHLY' | 'ANNUAL', paymentMethod: string, phone?: string) => void;
}

export function SubscriptionForm({ currentTier, onSubscribe }: SubscriptionFormProps) {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const studentTiers = Object.entries(PRICING_TIERS)
    .filter(([key]) => key.startsWith('STUDENT_'));

  const paymentMethods = [
    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: <Smartphone size={24} />, color: 'text-red' },
    { id: 'TNM_MPAMBA', name: 'TNM Mpamba', icon: <Smartphone size={24} />, color: 'text-blue-600' },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Building2 size={24} />, color: 'text-navy' },
    { id: 'PAYCHANGU', name: 'Card Payment', icon: <CreditCard size={24} />, color: 'text-green' },
  ];

  const handleSubmit = async () => {
    if (!selectedTier || !paymentMethod) return;
    setIsLoading(true);
    await onSubscribe(selectedTier, billingCycle, paymentMethod, phone || undefined);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-grey-light rounded-lg p-1 inline-flex">
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'MONTHLY'
                ? 'bg-white shadow text-navy'
                : 'text-grey-dark hover:text-navy'
            }`}
            onClick={() => setBillingCycle('MONTHLY')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'ANNUAL'
                ? 'bg-white shadow text-navy'
                : 'text-grey-dark hover:text-navy'
            }`}
            onClick={() => setBillingCycle('ANNUAL')}
          >
            Annual
            <Badge variant="success" size="sm" className="ml-2">Save 58%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {studentTiers.map(([tier, config]) => {
          const price = billingCycle === 'MONTHLY' ? config.monthlyPrice : config.annualPrice;
          const isPopular = tier === 'STUDENT_PREMIUM';
          const isCurrent = tier === currentTier;

          return (
            <Card
              key={tier}
              hover
              padding="lg"
              className={`relative ${
                isPopular ? 'ring-2 ring-red scale-105' : ''
              } ${
                selectedTier === tier ? 'ring-2 ring-green' : ''
              }`}
              onClick={() => setSelectedTier(tier)}
            >
              {isPopular && (
                <Badge
                  variant="error"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Most Popular
                </Badge>
              )}

              {isCurrent && (
                <Badge
                  variant="success"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Current Plan
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-navy">{config.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-navy">
                    {price ? formatCurrency(price) : 'Free'}
                  </span>
                  <span className="text-grey-medium text-sm">
                    {price ? (billingCycle === 'MONTHLY' ? '/month' : '/year') : ''}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-grey-dark">
                    <Check size={16} className="text-green mt-0.5 flex-shrink-0" />
                    {feature.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Payment Methods */}
      {selectedTier && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-navy">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === method.id
                    ? 'border-navy bg-navy/5'
                    : 'border-grey-light hover:border-navy/50'
                }`}
              >
                <div className={`${method.color} mb-2`}>{method.icon}</div>
                <p className="text-sm font-medium text-grey-dark">{method.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

{/* Phone Number for Mobile Money */}
          {paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'TNM_MPAMBA' ? (
            <Input
              label={paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
              placeholder={paymentMethod === 'AIRTEL_MONEY' ? '+265 999 000 000' : '+265 888 000 000'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isLoading}
              helperText={paymentMethod === 'AIRTEL_MONEY' ? 'Your Airtel Money registered phone number' : 'Your TNM Mpamba registered phone number'}
            />
          ) : null}

          {/* Submit */}
          {selectedTier && paymentMethod && (
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={isLoading}
              >
                Subscribe Now - {formatCurrency(
                  studentTiers.find(([t]) => t === selectedTier)?.[1]?.monthlyPrice || 0
                )}
              </Button>
              <p className="text-xs text-grey-medium mt-2">
                Cancel anytime. No long-term commitment.
              </p>
            </div>
          )}
    </div>
  );
}