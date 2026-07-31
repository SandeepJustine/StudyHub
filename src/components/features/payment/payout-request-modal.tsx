'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Building2, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

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
  const [operatorRefId, setOperatorRefId] = useState('');
  const [bankUuid, setBankUuid] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          ? { phone, operatorRefId }
          : { bankUuid, bankAccountName, bankAccountNumber };

      await onSubmit({
        amount: amountNum,
        method,
        accountDetails,
      });

      // Reset form
      setAmount('');
      setPhone('');
      setOperatorRefId('');
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
      icon: <Smartphone size={20} />,
      description: 'Payout to Airtel Money wallet',
    },
    {
      id: 'TNM_MPAMBA',
      name: 'TNM Mpamba',
      icon: <Smartphone size={20} />,
      description: 'Payout to TNM Mpamba wallet',
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      icon: <Building2 size={20} />,
      description: 'Direct bank transfer',
    },
  ];

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
                onClick={() => setMethod(m.id)}
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
              label="Phone Number"
              placeholder="+265 888 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="Mobile Money Operator Ref ID"
              placeholder="e.g., 20be6c20-adeb-4b5b-a7ba-0769820df4fb"
              value={operatorRefId}
              onChange={(e) => setOperatorRefId(e.target.value)}
              required
              disabled={loading}
              helperText="Get this from your mobile money operator"
            />
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
