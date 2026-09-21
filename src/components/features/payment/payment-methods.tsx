'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Building2,
  QrCode,
  Shield,
  Clock,
  Check,
  Upload,
  FileText,
  AlertCircle,
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
  requiresPhone?: boolean;
  requiresProof?: boolean;
}

interface PaymentMethodsProps {
  amount: number;
  onSelect: (methodId: string, extraData?: { phone?: string; proofFile?: File }) => void;
  selectedMethod?: string;
}

export function AirtelLogo() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-white rounded-lg shadow-sm" />
      <Image
        src="/images/payments/airtel.webp"
        alt="Airtel Money"
        width={40}
        height={40}
        className="object-contain relative z-10"
      />
    </div>
  );
}

export function TnmLogo() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-white rounded-lg shadow-sm" />
      <Image
        src="/images/payments/tnm.webp"
        alt="TNM Mpamba"
        width={40}
        height={40}
        className="object-contain relative z-10"
      />
    </div>
  );
}

export function CardPaymentIcon() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
        <rect x="1" y="1" width="62" height="38" rx="4" fill="#1A1A2E" stroke="#16213E" strokeWidth="1"/>
        <rect x="4" y="6" width="56" height="28" rx="2" fill="#0F3460"/>
        <text x="32" y="24" textAnchor="middle" fill="#E94560" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text>
        <rect x="4" y="34" width="56" height="2" rx="1" fill="#1A1A2E"/>
      </svg>
    </div>
  );
}

export function BankIcon() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    </div>
  );
}

export function PaymentMethods({ amount, onSelect, selectedMethod }: PaymentMethodsProps) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');

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
      requiresPhone: true,
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
      requiresPhone: true,
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
    {
      id: 'MANUAL_PAYMENT',
      name: 'Manual Payment (Bank Transfer)',
      description: 'Transfer to National Bank, then upload proof',
      icon: <BankIcon />,
      color: 'text-navy',
      bgColor: 'bg-navy/10',
      enabled: true,
      processingTime: '1-2 business days (after verification)',
      fee: 'Free',
      minAmount: 5000,
      maxAmount: 10000000,
      requiresProof: true,
    },
  ];

  const handleSelect = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (!method) return;

    const isDisabled = amount < method.minAmount || amount > method.maxAmount;
    if (isDisabled) return;

    if (method.requiresPhone) {
      // Phone will be collected separately
      onSelect(methodId, { phone });
    } else if (method.requiresProof) {
      if (!proofFile) {
        alert('Please upload proof of payment');
        return;
      }
      onSelect(methodId, { proofFile });
    } else {
      onSelect(methodId);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        alert('Only JPEG, PNG, or PDF files are allowed');
        return;
      }
      setProofFile(file);
    }
  };

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
              onClick={() => !isDisabled && handleSelect(method.id)}
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

              {isSelected && method.requiresPhone && (
                <Input
                  label="Phone Number"
                  placeholder="+265 999 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-3 ml-[68px] w-[calc(100%-68px)]"
                />
              )}

              {isSelected && method.requiresProof && (
                <div className="mt-3 ml-[68px] w-[calc(100%-68px)]">
                  <label className="block text-sm font-medium text-grey-dark mb-1.5">
                    Upload Proof of Payment
                  </label>
                  <div className="border-2 border-dashed border-grey-light rounded-lg p-4 text-center hover:border-navy transition-colors">
                    {proofFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-navy">
                        <FileText size={20} />
                        <span>{proofFile.name}</span>
                        <span className="text-grey-medium">({(proofFile.size / 1024).toFixed(1)} KB)</span>
                        <Button variant="ghost" size="sm" onClick={() => setProofFile(null)}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-grey-medium" />
                        <p className="text-sm text-grey-dark">Click to upload or drag & drop</p>
                        <p className="text-xs text-grey-medium">JPEG, PNG, or PDF (max 5MB)</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id={`proof-upload-${method.id}`}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`proof-upload-${method.id}`)?.click()}>
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                  {!proofFile && (
                    <p className="text-xs text-red mt-1">Proof of payment required</p>
                  )}
                </div>
              )}

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

      {selectedMethod === 'MANUAL_PAYMENT' && (
        <Card className="bg-navy/5 border-navy/20" padding="md">
          <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-600" />
            Bank Transfer Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-grey-medium">Bank</span>
              <span className="font-medium text-navy">National Bank of Malawi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-medium">Account Number</span>
              <span className="font-mono font-medium text-navy">1008157053</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-medium">Account Name</span>
              <span className="font-medium text-navy">StudyHub Malawi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-medium">Reference</span>
              <span className="font-mono font-medium text-navy">Your User ID + Course ID</span>
            </div>
          </div>
          <p className="text-xs text-grey-medium mt-3">
            After transferring, upload the proof (screenshot/receipt) above. Admin will verify within 1-2 business days.
          </p>
        </Card>
      )}

      {selectedMethod === 'AIRTEL_MONEY' && (
        <Card className="bg-red-50 border-red-200" padding="md">
          <h4 className="font-semibold text-red mb-2">Airtel Money Payment</h4>
          <p className="text-sm text-grey-dark">
            You will receive a prompt on your phone to confirm the payment. Use phone: <strong>0997011620</strong>
          </p>
        </Card>
      )}

      {selectedMethod === 'TNM_MPAMBA' && (
        <Card className="bg-blue-50 border-blue-200" padding="md">
          <h4 className="font-semibold text-blue-600 mb-2">TNM Mpamba Payment</h4>
          <p className="text-sm text-grey-dark">
            You will receive a prompt on your phone to confirm the payment. Use phone: <strong>0997011620</strong>
          </p>
        </Card>
      )}
    </div>
  );
}