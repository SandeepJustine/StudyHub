'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PaymentTransactionState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'RECONCILED';
export type EnrollmentState = 'not_enrolled' | 'enrolled' | 'completed' | 'payment_pending';

export interface PaymentStatusResponse {
  enrollmentStatus: EnrollmentState;
  transaction: {
    reference: string;
    status: PaymentTransactionState;
    paymentMethod: string;
    amount: number;
    createdAt: string;
    providerRef: string | null;
    requiresAdminReview: boolean;
    failureReason?: string;
  } | null;
  canVerify: boolean;
  message?: string;
}

const POLL_INTERVAL_MS = 8000;

export function usePaymentStatus(
  courseId: string,
  options: { enabled?: boolean; pollInterval?: number } = {}
) {
  const { enabled = true, pollInterval = POLL_INTERVAL_MS } = options;

  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Guards against setting state after unmount and drops stale poll responses.
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled || !courseId) return;

      const requestId = ++requestIdRef.current;
      if (!silent) setIsLoading(true);

      try {
        const response = await fetch(`/api/courses/${courseId}/payment-status`, {
          cache: 'no-store',
        });

        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (mountedRef.current) setError(body.error || 'Unable to load payment status');
          return;
        }

        const payload: PaymentStatusResponse = await response.json();
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        setData(payload);
        setError('');
      } catch {
        if (mountedRef.current) setError('Network error while checking payment status');
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [courseId, enabled]
  );

  const verify = useCallback(async () => {
    if (!enabled || !courseId) return null;

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: data?.transaction?.reference }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!mountedRef.current) return null;

      if (payload.transaction) {
        setData(payload as PaymentStatusResponse);
      }

      setError(payload.error ?? '');

      return payload as Partial<PaymentStatusResponse> & { error?: string };
    } catch {
      if (mountedRef.current) setError('Network error while verifying your payment');
      return null;
    } finally {
      if (mountedRef.current) setIsVerifying(false);
    }
  }, [courseId, enabled, data?.transaction?.reference]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  const status = data?.transaction?.status;
  const requiresAdminReview = data?.transaction?.requiresAdminReview ?? false;
  const enrollmentStatus = data?.enrollmentStatus;

  const shouldPoll =
    enabled && (status === 'PENDING' || enrollmentStatus === 'payment_pending') && !requiresAdminReview;

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = setInterval(() => {
      void load(true);
    }, pollInterval);

    return () => clearInterval(timer);
  }, [shouldPoll, pollInterval, load]);

  return {
    data,
    status: status ?? null,
    transaction: data?.transaction ?? null,
    enrollmentStatus: enrollmentStatus ?? 'not_enrolled',
    canVerify: data?.canVerify ?? false,
    isLoading,
    isVerifying,
    error,
    message: data?.message ?? '',
    refresh: () => load(true),
    verify,
  };
}

export default usePaymentStatus;