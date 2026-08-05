'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Building2, AlertCircle, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import Image from 'next/image';

interface PayChanguOperator {
  id: number;
  name: string;
  ref_id: string;
  short_code: string;
  providerMethod: string;
  supports_withdrawals: boolean;
  country: string;
  currency: string;
}

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    method: string;
    accountDetails: any;
  }) => Promise<void>;
  pendingEarnings: number;
  minPayout: number;
}

export function PayoutRequestModal({
  isOpen,
  onClose,
  onSubmit,
  pendingEarnings,
  minPayout,
}: PayoutRequestModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('AIRTEL_MONEY');
  const [phone, setPhone] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [bankUuid, setBankUuid] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [operators, setOperators] = useState<PayChanguOperator[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchOperators();
    }
  }, [isOpen]);

  const fetchOperators = async () => {
    setOperatorsLoading(true);
    try {
      const res = await fetch('/api/payments/methods');
      if (!res.ok) throw new Error('Failed to fetch operators');
      const result = await res.json();
      if (result.success && result.data) {
        const ops = result.data.operators || result.data.hardcodedOperators || [];
        setOperators(ops);
      }
    } catch {
      setOperators([]);
    } finally {
      setOperatorsLoading(false);
    }
  };

  const handleMethodChange = (m: string) => {
    setMethod(m);
    setSelectedOperator('');
    const match = operators.find((op) => op.providerMethod === m);
    if (match) {
      setSelectedOperator(match.ref_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amountNum = parseInt(amount);
      if (!amountNum || amountNum < minPayout) {
        throw new Error(`Minimum payout is ${formatCurrency(minPayout)}`);
      }
      if (amountNum > pendingEarnings) {
        throw new Error(`Insufficient balance. Available: ${formatCurrency(pendingEarnings)}`);
      }

      const accountDetails =
        method === 'AIRTEL_MONEY' || method === 'TNM_MPAMBA'
          ? { phone, operatorRefId: selectedOperator }
          : { bankUuid, bankAccountName, bankAccountNumber };

      await onSubmit({
        amount: amountNum,
        method,
        accountDetails,
      });

      setAmount('');
      setPhone('');
      setSelectedOperator('');
      setBankUuid('');
      setBankAccountName('');
      setBankAccountNumber('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'AIRTEL_MONEY',
      name: 'Airtel Money',
      icon: <Image src="/images/payments/airtel.webp" alt="Airtel" width={28} height={28} className="object-contain" />,
      description: 'Payout to Airtel Money wallet',
    },
    {
      id: 'TNM_MPAMBA',
      name: 'TNM Mpamba',
      icon: <Image src="/images/payments/tnm.webp" alt="TNM" width={28} height={28} className="object-contain" />,
      description: 'Payout to TNM Mpamba wallet',
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      icon: <Building2 size={20} />,
      description: 'Direct bank transfer',
    },
  ];

  const mobileOperators = operators.filter(
    (op) => op.providerMethod === 'AIRTEL_MONEY' || op.providerMethod === 'TNM_MPAMBA'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Payout" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="p-3 bg-grey-light/50 rounded-lg">
          <p className="text-sm text-grey-dark">Available Balance</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(pendingEarnings)}</p>
          <p className="text-xs text-grey-medium">Minimum payout: {formatCurrency(minPayout)}</p>
        </div>

        <Input
          label="Amount (MWK)"
          type="number"
          placeholder={`Min ${minPayout.toLocaleString()}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-grey-dark mb-2">Payout Method</label>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMethodChange(m.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                  method === m.id
                    ? 'border-navy bg-navy/5'
                    : 'border-grey-light hover:border-navy/50'
                }`}
              >
                <span className={method === m.id ? 'text-navy' : 'text-grey-medium'}>{m.icon}</span>
                <div>
                  <p className="font-medium text-navy text-sm">{m.name}</p>
                  <p className="text-xs text-grey-medium">{m.description}</p>
                </div>
                {method === m.id && <Check size={16} className="text-navy ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {method === 'AIRTEL_MONEY' || method === 'TNM_MPAMBA' ? (
          <>
            <Input
              label={method === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
              placeholder={method === 'AIRTEL_MONEY' ? '+265 999 000 000' : '+265 888 000 000'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              helperText={method === 'AIRTEL_MONEY' ? 'Your Airtel Money registered phone number' : 'Your TNM Mpamba registered phone number'}
            />
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-2">Mobile Money Operator</label>
              {operatorsLoading ? (
                <div className="flex items-center gap-2 p-3 text-grey-medium text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Loading operators...
                </div>
              ) : mobileOperators.length > 0 ? (
                <select
                  className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select an operator</option>
                  {mobileOperators.map((op) => (
                    <option key={op.ref_id} value={op.ref_id}>
                      {op.name} ({op.short_code.toUpperCase()})
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  label="Mobile Money Operator Ref ID"
                  placeholder="e.g., 20be6c20-adeb-4b5b-a7ba-0769820df4fb"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  required
                  disabled={loading}
                  helperText="Enter your mobile money operator reference ID"
                />
              )}
            </div>
          </>
        ) : (
          <>
            <Input
              label="Bank UUID"
              placeholder="Bank UUID from PayChangu"
              value={bankUuid}
              onChange={(e) => setBankUuid(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="Account Name"
              placeholder="John Doe"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="Account Number"
              placeholder="2652493369"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              required
              disabled={loading}
            />
          </>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Request Payout
          </Button>
        </div>
      </form>
    </Modal>
  );
}