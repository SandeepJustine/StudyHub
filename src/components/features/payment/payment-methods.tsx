'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Building2,
  QrCode,
  Shield,
  Clock,
  Check,
} from 'lucide-react';
import Image from 'next/image';

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

function AirtelLogo() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <Image
        src="/images/payments/airtel.webp"
        alt="Airtel Money"
        width={32}
        height={32}
        className="object-contain"
      />
    </div>
  );
}

function TnmLogo() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <Image
        src="/images/payments/tnm.webp"
        alt="TNM Mpamba"
        width={32}
        height={32}
        className="object-contain"
      />
    </div>
  );
}

function CardPaymentIcon() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <rect x="1" y="1" width="62" height="38" rx="4" fill="#1A1A2E" stroke="#16213E" strokeWidth="1"/>
        <rect x="4" y="6" width="56" height="28" rx="2" fill="#0F3460"/>
        <text x="32" y="24" textAnchor="middle" fill="#E94560" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text>
        <rect x="4" y="34" width="56" height="2" rx="1" fill="#1A1A2E"/>
      </svg>
    </div>
  );
}

export function PaymentMethods({ amount, onSelect, selectedMethod }: PaymentMethodsProps) {
  const methods: PaymentMethod[] = [
    {
      id: 'AIRTEL_MONEY',
      name: 'Airtel Money',
      description: 'Pay using your Airtel Money wallet',
      icon: <AirtelLogo />,
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
      icon: <TnmLogo />,
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
      name: 'Credit / Debit Card',
      description: 'Pay securely with Visa or Mastercard',
      icon: <CardPaymentIcon />,
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
                <div className={`p-3 rounded-lg ${method.bgColor} ${method.color}`}>
                  {method.icon}
                </div>

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

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-navy' : 'border-grey-medium'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                </div>
              </div>

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