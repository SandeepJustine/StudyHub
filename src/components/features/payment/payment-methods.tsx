'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  CreditCard, 
  Building2, 
  QrCode,
  Shield,
  Clock,
  Check,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  enabled: boolean;
  processingTime: string;
  fee: string;
  minAmount: number;
  maxAmount: number;
}

interface PaymentMethodsProps {
  amount: number;
  onSelect: (methodId: string) => void;
  selectedMethod?: string;
}

export function PaymentMethods({ amount, onSelect, selectedMethod }: PaymentMethodsProps) {
  const methods: PaymentMethod[] = [
    {
      id: 'AIRTEL_MONEY',
      name: 'Airtel Money',
      description: 'Pay using your Airtel Money wallet',
      icon: <Smartphone size={28} />,
      color: 'text-red',
      bgColor: 'bg-red-50',
      enabled: true,
      processingTime: 'Instant',
      fee: 'Free',
      minAmount: 100,
      maxAmount: 500000,
    },
    {
      id: 'TNM_MPAMBA',
      name: 'TNM Mpamba',
      description: 'Pay using your TNM Mpamba wallet',
      icon: <Smartphone size={28} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      enabled: true,
      processingTime: 'Instant',
      fee: 'Free',
      minAmount: 100,
      maxAmount: 500000,
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      description: 'Transfer from any Malawian bank',
      icon: <Building2 size={28} />,
      color: 'text-navy',
      bgColor: 'bg-navy/10',
      enabled: true,
      processingTime: '1-2 business days',
      fee: 'Free',
      minAmount: 5000,
      maxAmount: 10000000,
    },
    {
      id: 'PAYCHANGU',
      name: 'Card Payment',
      description: 'Pay with Visa or Mastercard',
      icon: <CreditCard size={28} />,
      color: 'text-green',
      bgColor: 'bg-green-50',
      enabled: true,
      processingTime: 'Instant',
      fee: '2.5%',
      minAmount: 1000,
      maxAmount: 5000000,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-navy">Select Payment Method</h3>
      
      <div className="grid gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isDisabled = amount < method.minAmount || amount > method.maxAmount;

          return (
            <button
              key={method.id}
              onClick={() => !isDisabled && onSelect(method.id)}
              disabled={isDisabled}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-navy bg-navy/5 shadow-md'
                  : isDisabled
                  ? 'border-grey-light bg-grey-light/30 cursor-not-allowed opacity-60'
                  : 'border-grey-light hover:border-navy/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-lg ${method.bgColor} ${method.color}`}>
                  {method.icon}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-navy">{method.name}</h4>
                    {isSelected && (
                      <Badge variant="success" size="sm">
                        <Check size={12} className="mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-grey-medium">{method.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-grey-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {method.processingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={12} />
                      Fee: {method.fee}
                    </span>
                  </div>
                </div>

                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-navy' : 'border-grey-medium'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                </div>
              </div>

              {/* Disabled Message */}
              {isDisabled && (
                <p className="text-xs text-red mt-2 ml-[68px]">
                  {amount < method.minAmount
                    ? `Minimum amount is MWK ${method.minAmount.toLocaleString()}`
                    : `Maximum amount is MWK ${method.maxAmount.toLocaleString()}`
                  }
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}