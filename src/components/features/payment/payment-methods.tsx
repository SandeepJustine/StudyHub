'use client';

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DollarSignIcon,
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
  requiresBankInfo?: boolean;
}

export interface PaymentExtraData {
  phone?: string;
  proofFile?: File;
  bankInfo?: string;
}

export interface PaymentMethodsHandle {
  validate: () => string | null;
}

interface PaymentMethodsProps {
  amount: number;
  onSelect: (methodId: string, extraData?: PaymentExtraData) => void;
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
        <text x="32" y="24" textAnchor="middle" fill="#E94560" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text>
        <rect x="4" y="34" width="100" height="1" rx="1" fill="#1A1A2E"/>
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

const METHODS: PaymentMethod[] = [
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
    id: 'MANUAL_PAYMENT',
    name: 'Bank Transfer',
    description: 'Transfer to National Bank: 1008157053, then submit your reference',
    icon: <DollarSignIcon />,
    color: 'text-navy',
    bgColor: 'bg-navy/10',
    enabled: true,
    processingTime: '1-2 business days (after verification)',
    fee: 'Free',
    minAmount: 100,
    maxAmount: 10000000,
    requiresProof: true,
    requiresBankInfo: true,
  },
];

const PHONE_RULES: Record<string, RegExp> = {
  AIRTEL_MONEY: /^(099|098|26599|26598)\d{7}$/,
  TNM_MPAMBA: /^(088|26588)\d{7}$/,
};

const PHONE_HINTS: Record<string, string> = {
  AIRTEL_MONEY: 'e.g., 0999 123 456 or +265999123456',
  TNM_MPAMBA: 'e.g., 0888 123 456 or +265888123456',
};

export const PaymentMethods = forwardRef<PaymentMethodsHandle, PaymentMethodsProps>(
  function PaymentMethods({ amount, onSelect, selectedMethod }, ref) {
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [phone, setPhone] = useState('');
    const [bankInfo, setBankInfo] = useState('');
    const [touchedMethod, setTouchedMethod] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const selectedConfig = useMemo(
      () => METHODS.find((m) => m.id === selectedMethod),
      [selectedMethod]
    );

    const currentExtraData = useMemo((): PaymentExtraData | undefined => {
      if (!selectedConfig) return undefined;
      if (selectedConfig.requiresPhone) return { phone };
      if (selectedConfig.requiresProof) return { proofFile: proofFile ?? undefined, bankInfo: bankInfo || undefined };
      if (selectedConfig.requiresBankInfo) return { bankInfo };
      return undefined;
    }, [selectedConfig, phone, proofFile, bankInfo]);

    const emit = (methodId: string, extra?: PaymentExtraData) => {
      onSelect(methodId, extra);
    };

    const isAmountAllowed = (method: PaymentMethod) =>
      amount >= method.minAmount && amount <= method.maxAmount;

    const validatePhone = (methodId: string, value: string): string | null => {
      const rule = PHONE_RULES[methodId];
      if (!rule) return null;
      const raw = value.replace(/[\s+]/g, '');
      if (!raw) return 'Phone number is required';
      return rule.test(raw) ? null : `Invalid ${methodId === 'AIRTEL_MONEY' ? 'Airtel' : 'TNM'} number. ${PHONE_HINTS[methodId]}`;
    };

    const validate = useMemo(
      () => (): string | null => {
        if (!selectedConfig) return 'Please select a payment method';
        if (!isAmountAllowed(selectedConfig)) {
          return amount < selectedConfig.minAmount
            ? `Minimum amount for this method is MWK ${selectedConfig.minAmount.toLocaleString()}`
            : `Maximum amount for this method is MWK ${selectedConfig.maxAmount.toLocaleString()}`;
        }
        if (selectedConfig.requiresPhone) {
          const error = validatePhone(selectedConfig.id, phone);
          if (error) return error;
        }
        if (selectedConfig.requiresBankInfo && !bankInfo.trim()) {
          return 'Please enter the bank transfer reference';
        }
        if (selectedConfig.requiresProof && !proofFile) {
          return 'Please upload your proof of payment';
        }
        return null;
      },
      [selectedConfig, amount, phone, bankInfo, proofFile]
    );

    useImperativeHandle(ref, () => ({ validate }), [validate]);

    const handleSelect = (methodId: string) => {
      const method = METHODS.find((m) => m.id === methodId);
      if (!method || !isAmountAllowed(method)) return;

      if (methodId !== selectedMethod) {
        setTouchedMethod(null);
        if (!method.requiresPhone) setPhone('');
        if (!method.requiresProof) setProofFile(null);
        if (!method.requiresBankInfo) setBankInfo('');

        const nextExtra: PaymentExtraData | undefined = method.requiresPhone
          ? { phone: '' }
          : method.requiresProof
            ? { proofFile: undefined, bankInfo: '' }
            : method.requiresBankInfo
              ? { bankInfo: '' }
              : undefined;
        onSelect(methodId, nextExtra);
        return;
      }

      setTouchedMethod(methodId);
      emit(methodId, currentExtraData);
    };

    const handlePhoneChange = (value: string) => {
      const raw = value.replace(/\D/g, '');
      const formatted = raw.replace(/(\d{4})(\d{0,3})(\d{0,3})/, (_, a, b, c) => `${a}${b ? ' ' + b : ''}${c ? ' ' + c : ''}`);
      setPhone(formatted);
      if (selectedMethod) onSelect(selectedMethod, { phone: formatted });
    };

    const handleBankInfoChange = (value: string) => {
      setBankInfo(value);
      if (selectedMethod) onSelect(selectedMethod, { ...currentExtraData, bankInfo: value });
    };

    const handleProofChange = (file: File | null) => {
      setProofFile(file);
      if (selectedMethod) onSelect(selectedMethod, { ...currentExtraData, proofFile: file ?? undefined });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setUploadError('Only JPEG, PNG, or PDF files are allowed');
        return;
      }
      setUploadError(null);
      handleProofChange(file);
      e.target.value = '';
    };

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-navy">Select Payment Method</h3>

        <div className="grid gap-3" role="radiogroup" aria-label="Payment method">
          {METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            const isDisabled = !isAmountAllowed(method);
            const showError = touchedMethod === method.id && !isDisabled;

            return (
              <div
                key={method.id}
                className={`w-full min-w-0 overflow-hidden rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-navy bg-navy/5 shadow-md'
                    : isDisabled
                      ? 'border-grey-light bg-grey-light/30 cursor-not-allowed opacity-60'
                      : selectedMethod
                        ? 'border-grey-light bg-white hover:border-navy/30 opacity-70 hover:opacity-100'
                        : 'border-grey-light bg-white hover:border-navy/40 hover:shadow-sm'
                }`}
              >
                <div
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => handleSelect(method.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(method.id);
                    }
                  }}
                  className={`flex items-center gap-3 sm:gap-4 w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                    isSelected ? 'p-4 sm:p-5' : 'p-3 sm:p-4'
                  }`}
                >
                  <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${method.bgColor} ${method.color}`}>{method.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-navy text-sm sm:text-base">{method.name}</h4>
                      {isSelected && (
                        <Badge variant="success" size="sm">
                          <Check size={12} className="mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>

                    {isSelected ? (
                      <>
                        <p className="text-sm text-grey-medium mt-1">{method.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-grey-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {method.processingTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield size={12} />
                            Fee: {method.fee}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-grey-medium mt-0.5 truncate">
                        {method.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-navy' : 'border-grey-medium'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                  </div>
                </div>

                {isSelected && (
                  <div className="px-4 sm:px-5 pb-4 min-w-0">
                    {method.id === 'MANUAL_PAYMENT' && (
                      <Card className="bg-navy/5 border-navy/20 mb-3" padding="sm">
                        <h4 className="font-semibold text-navy text-sm mb-2 flex items-center gap-2">
                          <AlertCircle size={16} className="text-yellow-600 shrink-0" />
                          Bank Transfer Details
                        </h4>
                        <dl className="text-xs sm:text-sm divide-y divide-navy/10">
                          {[
                            { label: 'Bank', value: 'National Bank of Malawi' },
                            { label: 'Account Number', value: '1008157053', mono: true },
                            { label: 'Account Name', value: 'StudyHub Malawi' },
                            { label: 'Reference', value: 'Your User ID + Course ID', mono: true },
                          ].map((row) => (
                            <div
                              key={row.label}
                              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5"
                            >
                              <dt className="text-grey-medium">{row.label}</dt>
                              <dd
                                className={`min-w-0 font-medium text-navy break-all ${row.mono ? 'font-mono' : ''}`}
                              >
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="text-xs text-grey-medium mt-2">
                          Transfer the exact amount, then enter your reference and upload the receipt below.
                        </p>
                      </Card>
                    )}

                    {method.requiresPhone && (
                      <div className="pt-1">
                        <Input
                          label="Phone Number"
                          placeholder={method.id === 'AIRTEL_MONEY' ? '0999 000 000' : '0888 000 000'}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          required
                        />
                        <p className="text-xs text-grey-medium mt-1">{PHONE_HINTS[method.id]}</p>
                        {showError && <FieldError>{validatePhone(method.id, phone)}</FieldError>}
                      </div>
                    )}

                    {method.requiresBankInfo && (
                      <div className={method.requiresPhone ? 'mt-3' : 'pt-1'}>
                        <Input
                          label="Bank Reference / Transaction ID"
                          placeholder="Enter your bank transfer reference"
                          value={bankInfo}
                          onChange={(e) => handleBankInfoChange(e.target.value)}
                          required
                        />
                        <p className="text-xs text-grey-medium mt-1">
                          Enter the reference number provided by your bank after transfer.
                        </p>
                        {showError && !bankInfo.trim() && (
                          <FieldError>Please enter the bank transfer reference</FieldError>
                        )}
                      </div>
                    )}

                    {method.requiresProof && (
                      <div className={method.requiresPhone || method.requiresBankInfo ? 'mt-3' : 'pt-1'}>
                        <label
                          htmlFor={`proof-upload-${method.id}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-3 border-2 border-dashed border-grey-light rounded-lg p-4 text-center hover:border-navy hover:bg-navy/5 focus-within:border-navy transition-colors cursor-pointer"
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleFileUpload}
                            className="sr-only"
                            id={`proof-upload-${method.id}`}
                          />

                          {proofFile ? (
                            <>
                              <div className="flex items-center gap-2 text-sm text-navy min-w-0 flex-1 text-left">
                                <FileText size={20} className="shrink-0" />
                                <span className="truncate">{proofFile.name}</span>
                                <span className="text-grey-medium whitespace-nowrap">
                                  ({(proofFile.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleProofChange(null);
                                }}
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <>
                              <Upload size={24} className="text-grey-medium shrink-0" />
                              <div className="text-left sm:text-center">
                                <p className="text-sm text-grey-dark">Tap to upload your receipt</p>
                                <p className="text-xs text-grey-medium mt-0.5">
                                  Screenshot or PDF, up to 5MB
                                </p>
                              </div>
                            </>
                          )}
                        </label>
                        {uploadError && <FieldError>{uploadError}</FieldError>}
                        {showError && !uploadError && !proofFile && (
                          <FieldError>Proof of payment is required</FieldError>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-2 border-t border-grey-light/70">
                      <button
                        type="button"
                        onClick={() => {
                          setTouchedMethod(null);
                          setUploadError(null);
                          onSelect('', {});
                        }}
                        className="text-xs text-grey-medium hover:text-navy underline underline-offset-2 text-left"
                      >
                        Choose a different method
                      </button>
                      {isDisabled && (
                        <p className="text-xs text-red">
                          {amount < method.minAmount
                            ? `Minimum amount is MWK ${method.minAmount.toLocaleString()}`
                            : `Maximum amount is MWK ${method.maxAmount.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!isSelected && isDisabled && (
                  <p className="px-4 sm:px-5 pb-3 text-xs text-red">
                    {amount < method.minAmount
                      ? `Minimum amount is MWK ${method.minAmount.toLocaleString()}`
                      : `Maximum amount is MWK ${method.maxAmount.toLocaleString()}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {selectedMethod === 'AIRTEL_MONEY' && (
          <Card className="bg-red-50 border-red-200" padding="md">
            <h4 className="font-semibold text-red mb-2">Airtel Money Payment</h4>
            <p className="text-sm text-grey-dark">
              You will receive a prompt on your phone to confirm the payment.
            </p>
          </Card>
        )}

        {selectedMethod === 'TNM_MPAMBA' && (
          <Card className="bg-blue-50 border-blue-200" padding="md">
            <h4 className="font-semibold text-blue-600 mb-2">TNM Mpamba Payment</h4>
            <p className="text-sm text-grey-dark">
              You will receive a prompt on your phone to confirm the payment.
            </p>
          </Card>
        )}
      </div>
    );
  }
);

function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-xs text-red mt-1">{children}</p>;
}
