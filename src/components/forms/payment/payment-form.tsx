'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, CreditCard, Check } from 'lucide-react';

interface CardPaymentFormProps {
  onSubmit: (data: {
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    cardholderName: string;
  }) => void;
  onCancel: () => void;
  amount: number;
  loading?: boolean;
}

export function CardPaymentForm({
  onSubmit,
  onCancel,
  amount,
  loading,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cvvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) {
      setCardBrand('visa');
    } else if (/^5[1-5]/.test(cleaned)) {
      setCardBrand('mastercard');
    } else if (/^3[47]/.test(cleaned)) {
      setCardBrand('amex');
    } else if (cleaned.length > 0) {
      setCardBrand('unknown');
    } else {
      setCardBrand(null);
    }
  }, [cardNumber]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanedNumber = cardNumber.replace(/\s/g, '');
    if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      newErrors.cardExpiry = 'Use MM/YY format';
    } else {
      const [month, year] = cardExpiry.split('/');
      const now = new Date();
      const expDate = new Date(2000 + parseInt(year), parseInt(month), 0);
      if (expDate < now) {
        newErrors.cardExpiry = 'Card is expired';
      }
    }

    if (cardCvv.length < 3 || cardCvv.length > 4) {
      newErrors.cardCvv = 'Invalid CVV';
    }

    if (cardholderName.trim().length < 2) {
      newErrors.cardholderName = 'Enter the cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardExpiry,
      cardCvv,
      cardholderName: cardholderName.trim(),
    });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCardExpiry(formatExpiry(value));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCardCvv(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Preview */}
      <div className="p-4 bg-gradient-to-br from-navy to-navy/80 rounded-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <CreditCard size={28} />
            {cardBrand && (
              <Badge variant="neutral" className="bg-white/10 text-white border-white/20">
                {cardBrand.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-lg font-mono tracking-widest mb-6 min-h-[24px]">
            {cardNumber || '•••• •••• •••• ••••'}
          </p>
          <div className="flex justify-between text-sm opacity-80">
            <div>
              <p className="text-xs opacity-60 mb-1">Card Holder</p>
              <p className="font-medium tracking-wide">
                {cardholderName || 'YOUR NAME'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60 mb-1">Expires</p>
              <p className="font-medium tracking-wide">
                {cardExpiry || 'MM/YY'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Input
        label="Card Number"
        placeholder="4111 1111 1111 1111"
        value={cardNumber}
        onChange={handleCardNumberChange}
        maxLength={19}
        required
        disabled={loading}
        error={errors.cardNumber}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Expiry Date"
          placeholder="MM/YY"
          value={cardExpiry}
          onChange={handleExpiryChange}
          maxLength={5}
          required
          disabled={loading}
          error={errors.cardExpiry}
        />
        <Input
          ref={cvvRef}
          label="CVV"
          placeholder="123"
          value={cardCvv}
          onChange={handleCvvChange}
          maxLength={4}
          required
          disabled={loading}
          error={errors.cardCvv}
          type="password"
        />
      </div>

      <Input
        label="Cardholder Name"
        placeholder="John Doe"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        required
        disabled={loading}
        error={errors.cardholderName}
      />

      <div className="flex items-center gap-2 text-xs text-grey-medium">
        <Lock size={12} />
        <Shield size={12} />
        <span>Your card details are encrypted and secure</span>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Pay {amount > 0 ? `MWK ${amount.toLocaleString()}` : 'Pay'}
        </Button>
      </div>
    </form>
  );
}