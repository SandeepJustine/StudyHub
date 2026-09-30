'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Smartphone, Building2, Upload, FileText, ArrowLeft } from 'lucide-react';
import { AirtelLogo, TnmLogo, CardPaymentIcon } from '@/components/features/payment/payment-methods';
import { PRICING_TIERS } from '@/lib/billing/pricing-tiers';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface SubscriptionFormProps {
  currentTier?: string;
  onSubscribe: (tier: string, cycle: 'MONTHLY' | 'ANNUAL', paymentMethod: string, phone?: string, proofFile?: File) => void;
}

export function SubscriptionForm({ currentTier, onSubscribe }: SubscriptionFormProps) {
  const [step, setStep] = useState(1); // 1: Plan, 2: Method, 3: Details
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const studentTiers = Object.entries(PRICING_TIERS)
    .filter(([key]) => key.startsWith('STUDENT_'));

  const selectedTierPrice = billingCycle === 'MONTHLY' 
    ? studentTiers.find(([t]) => t === selectedTier)?.[1]?.monthlyPrice || 0
    : studentTiers.find(([t]) => t === selectedTier)?.[1]?.annualPrice || 0;

  const paymentMethods = [
    { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: <AirtelLogo /> },
    { id: 'TNM_MPAMBA', name: 'TNM Mpamba', icon: <TnmLogo /> },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Building2 size={24} className="text-navy" /> },
    { id: 'MANUAL_PAYMENT', name: 'Manual Payment', icon: <CardPaymentIcon /> },
  ];

  const validatePhone = (): boolean => {
    if (!['AIRTEL_MONEY', 'TNM_MPAMBA'].includes(paymentMethod)) return true;
    const rawPhone = phone.replace(/[\s+]/g, ''); 
    const airtelRegex = /^(099|098|26599|26598)\d{7}$/;
    const tnmRegex = /^(088|26588)\d{7}$/;

    if (paymentMethod === 'AIRTEL_MONEY' && !airtelRegex.test(rawPhone)) {
      alert('Invalid Airtel number. Use format 0999XXXXXXX or +265999XXXXXXX');
      return false;
    }
    if (paymentMethod === 'TNM_MPAMBA' && !tnmRegex.test(rawPhone)) {
      alert('Invalid TNM number. Use format 0888XXXXXXX or +265888XXXXXXX');
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!validatePhone()) return;
    if (paymentMethod === 'MANUAL_PAYMENT' && !proofFile) {
      alert('Please upload proof of payment');
      return;
    }
    setIsLoading(true);
    await onSubscribe(selectedTier, billingCycle, paymentMethod, phone || undefined, proofFile || undefined);
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setProofFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-grey-dark">
        <span className={step === 1 ? 'text-navy font-bold' : ''}>1. Plan</span>
        <span className="h-px w-8 bg-grey-medium"></span>
        <span className={step === 2 ? 'text-navy font-bold' : ''}>2. Method</span>
        <span className="h-px w-8 bg-grey-medium"></span>
        <span className={step === 3 ? 'text-navy font-bold' : ''}>3. Details</span>
      </div>

      {/* STEP 1: Plan Selection */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-grey-light rounded-lg p-1 inline-flex">
              <button
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'MONTHLY' ? 'bg-white shadow text-navy' : 'text-grey-dark hover:text-navy'}`}
                onClick={() => setBillingCycle('MONTHLY')}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'ANNUAL' ? 'bg-white shadow text-navy' : 'text-grey-dark hover:text-navy'}`}
                onClick={() => setBillingCycle('ANNUAL')}
              >
                Annual <Badge variant="success" size="sm" className="ml-2">Save 58%</Badge>
              </button>
            </div>
          </div>

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
                  className={`relative ${isPopular ? 'ring-2 ring-red scale-105' : ''} ${selectedTier === tier ? 'ring-2 ring-green' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  {isPopular && <Badge variant="error" className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                  {isCurrent && <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">Current Plan</Badge>}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-navy">{config.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-navy">{price ? formatCurrency(price) : 'Free'}</span>
                      <span className="text-grey-medium text-sm">{price ? (billingCycle === 'MONTHLY' ? '/month' : '/year') : ''}</span>
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

          <div className="text-center">
            <Button variant="primary" disabled={!selectedTier} onClick={() => setStep(2)}>
              Continue to Payment
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Payment Method Selection */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-navy text-center">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${paymentMethod === method.id ? 'border-navy bg-navy/5' : 'border-grey-light hover:border-navy/50'}`}
              >
                <div className="mb-2 flex justify-center">{method.icon}</div>
                <p className="text-sm font-medium text-grey-dark">{method.name}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" disabled={!paymentMethod} onClick={() => setStep(3)}>Enter Details</Button>
          </div>
        </div>
      )}

      {/* STEP 3: Dynamic Details & Submit */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-navy text-center">
            {paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer Details' : paymentMethod === 'MANUAL_PAYMENT' ? 'Manual Payment Verification' : 'Complete Payment'}
          </h3>

          <Card className="bg-grey-light/50 p-6">
            {/* Mobile Money Fields */}
            {(paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'TNM_MPAMBA') && (
              <div className="space-y-4">
                <p className="text-sm text-grey-dark">Enter your mobile money number to receive a USSD prompt.</p>
                <Input
                  label={paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
                  placeholder={paymentMethod === 'AIRTEL_MONEY' ? '0999 000 000' : '0888 000 000'}
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const formatted = raw.replace(/(\d{4})(\d{0,3})(\d{0,3})/, (_, a, b, c) => `${a}${b ? ' ' + b : ''}${c ? ' ' + c : ''}`);
                    setPhone(formatted);
                  }}
                  required
                  disabled={isLoading}
                  helperText={paymentMethod === 'AIRTEL_MONEY' ? 'e.g., 0999 123 456 or +265999123456' : 'e.g., 0888 123 456 or +265888123456'}
                />
              </div>
            )}

            {/* Bank Transfer Display */}
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4">
                <p className="text-sm text-grey-dark">Transfer funds to the following account details:</p>
                <div className="bg-white p-4 rounded-lg border border-grey-medium space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Bank:</span> <span className="font-medium text-navy">National Bank of Malawi</span></div>
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Account Name:</span> <span className="font-medium text-navy">StudyHub Malawi</span></div>
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Account Number:</span> <span className="font-medium text-navy">1008157053</span></div>
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Amount:</span> <span className="font-bold text-red">MWK {selectedTierPrice.toLocaleString()}</span></div>
                </div>
                <p className="text-xs text-grey-medium">Use your phone number as the payment reference. Payment auto-verifies in 5-30 mins.</p>
              </div>
            )}

            {/* Manual Payment Upload */}
            {paymentMethod === 'MANUAL_PAYMENT' && (
              <div className="space-y-4">
                <p className="text-sm text-grey-dark">Upload proof of bank transfer or cash deposit.</p>
                <div className="bg-white p-4 rounded-lg border border-grey-medium space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Bank:</span> <span className="font-medium text-navy">National Bank of Malawi</span></div>
                  <div className="flex justify-between text-sm"><span className="text-grey-medium">Account Number:</span> <span className="font-medium text-navy">1008157053</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-grey-dark mb-1">Upload Proof (PDF/JPG/PNG)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-grey-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-navy/10 file:text-navy hover:file:bg-navy/20"
                  />
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={handleFinalSubmit} loading={isLoading}>
              {paymentMethod === 'BANK_TRANSFER' ? 'I have made the transfer' : 'Pay Now'} - {formatCurrency(selectedTierPrice)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
