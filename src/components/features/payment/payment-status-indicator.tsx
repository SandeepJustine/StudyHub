'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePaymentStatus, type PaymentTransactionState } from '@/hooks/usePaymentStatus';
import { formatCurrency } from '@/utils/formatters';

interface PaymentStatusIndicatorProps {
  courseId: string;
  /** Only useful right after a payment was initiated in this session. */
  active?: boolean;
  onStatusChange?: (status: PaymentTransactionState | null, enrolled: boolean) => void;
  onVerified?: () => void;
  className?: string;
}

const STATE_STYLES: Record<
  PaymentTransactionState,
  { wrapper: string; icon: React.ReactNode; title: string; body: string }
> = {
  PENDING: {
    wrapper: 'bg-blue-50 border-blue-600',
    icon: <Loader2 size={20} className="text-blue-600 animate-spin" />,
    title: 'Payment awaiting confirmation',
    body: 'We are waiting for confirmation from your payment provider. This usually takes a few seconds.',
  },
  COMPLETED: {
    wrapper: 'bg-green-50 border-green',
    icon: <CheckCircle2 size={20} className="text-green" />,
    title: 'Payment successful',
    body: 'Your payment was confirmed and your enrolment is now active.',
  },
  FAILED: {
    wrapper: 'bg-red-50 border-red',
    icon: <XCircle size={20} className="text-red" />,
    title: 'Payment not completed',
    body: 'We could not confirm this payment. You can check again or start over with another method.',
  },
  REFUNDED: {
    wrapper: 'bg-grey-light border-grey-medium',
    icon: <RefreshCw size={20} className="text-grey-medium" />,
    title: 'Payment refunded',
    body: 'This payment was refunded.',
  },
  RECONCILED: {
    wrapper: 'bg-green-50 border-green',
    icon: <CheckCircle2 size={20} className="text-green" />,
    title: 'Payment confirmed',
    body: 'Your payment was confirmed and settled.',
  },
};

export function PaymentStatusIndicator({
  courseId,
  active = true,
  onStatusChange,
  onVerified,
  className = '',
}: PaymentStatusIndicatorProps) {
  const {
    status,
    transaction,
    enrollmentStatus,
    canVerify,
    isLoading,
    isVerifying,
    error,
    message,
    verify,
    refresh,
  } = usePaymentStatus(courseId, { enabled: active });

  const [feedback, setFeedback] = useState('');
  const notifiedRef = useRef<string | null>(null);

  const enrolled = enrollmentStatus === 'enrolled' || enrollmentStatus === 'completed';

  useEffect(() => {
    if (!status) return;
    if (notifiedRef.current === status) return;
    notifiedRef.current = status;
    onStatusChange?.(status, enrolled);
    if (status === 'COMPLETED') onVerified?.();
  }, [status, enrolled, onStatusChange, onVerified]);

  const handleVerify = async () => {
    const result = await verify();
    if (result?.message) setFeedback(result.message);
    else if (result?.error) setFeedback(result.error);
  };

  if (!active) return null;

  if (isLoading && !transaction) {
    return (
      <div className={`rounded-xl border-l-4 border-grey-light bg-grey-light/40 p-4 ${className}`}>
        <div className="flex items-center gap-3 text-sm text-grey-medium">
          <Loader2 size={18} className="animate-spin shrink-0" />
          <span>Checking payment status…</span>
        </div>
      </div>
    );
  }

  if (!transaction) {
    if (error) {
      return (
        <div className={`rounded-xl border-l-4 border-red bg-red-50 p-4 ${className}`}>
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-red shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy">Could not load payment status</p>
              <p className="text-xs text-grey-medium mt-0.5 break-words">{error}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const style = STATE_STYLES[transaction.status] ?? STATE_STYLES.PENDING;
  const awaitingAdmin = transaction.requiresAdminReview && transaction.status === 'PENDING';

  const title = awaitingAdmin ? 'Receipt under review' : style.title;
  const body = awaitingAdmin
    ? 'Your transfer receipt was submitted. An admin confirms bank payments within 1-2 business days.'
    : style.body;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border-l-4 border ${style.wrapper} p-4 space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5">{awaitingAdmin ? <Landmark size={20} className="text-yellow-600" /> : style.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy text-sm break-words">{title}</p>
          <p className="text-sm text-grey-dark mt-1 break-words">{body}</p>

          {transaction.status === 'FAILED' && transaction.failureReason && (
            <p className="text-xs text-red mt-1 break-words">{transaction.failureReason}</p>
          )}

          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-grey-medium">
            <dt className="font-medium text-grey-medium">Reference</dt>
            <dd className="font-mono text-navy break-all">{transaction.reference}</dd>
            <dt className="font-medium text-grey-medium">Method</dt>
            <dd className="text-navy break-words">{transaction.paymentMethod.replace(/_/g, ' ')}</dd>
            <dt className="font-medium text-grey-medium">Amount</dt>
            <dd className="text-navy">{formatCurrency(transaction.amount)}</dd>
            <dt className="font-medium text-grey-medium">Started</dt>
            <dd className="text-navy">{new Date(transaction.createdAt).toLocaleString()}</dd>
          </dl>
        </div>
      </div>

      {(feedback || message || error) && (
        <p className="text-xs text-grey-dark bg-white/70 rounded-md px-3 py-2 break-words">
          {feedback || message || error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {transaction.status === 'PENDING' && !awaitingAdmin && (
          <Button
            type="button"
            variant="navy"
            size="sm"
            loading={isVerifying}
            disabled={!canVerify || isVerifying}
            onClick={handleVerify}
          >
            {!isVerifying && <ShieldCheck size={16} className="mr-1.5" />}
            Verify Your Payment
          </Button>
        )}

        {awaitingAdmin && (
          <span className="flex items-center gap-1.5 text-xs text-grey-medium">
            <Clock size={14} /> Verification is done manually for bank transfers
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={isVerifying}
          onClick={() => void refresh()}
          aria-label="Refresh payment status"
        >
          {!isVerifying && <RefreshCw size={16} className="mr-1.5" />}
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default PaymentStatusIndicator;