'use client';

import { useCallback, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PaymentMethods,
  type PaymentExtraData,
  type PaymentMethodsHandle,
} from '@/components/features/payment/payment-methods';
import { PaymentStatusIndicator } from '@/components/features/payment/payment-status-indicator';
import type { PaymentTransactionState } from '@/hooks/usePaymentStatus';
import { 
  Check, 
  Shield, 
  Clock, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export interface EnrollResult {
  transaction?: { status: string } | null;
  redirectUrl?: string | null;
}

interface CourseEnrollmentProps {
  course: {
    id: string;
    title: string;
    price: number;
    subject: string;
    instructor: {
      user: { fullName: string };
    };
  };
  onEnroll: (
    courseId: string,
    paymentMethod: string,
    extraData?: PaymentExtraData
  ) => void | Promise<EnrollResult | void>;
  onCancel: () => void;
}

type Phase = 'form' | 'awaiting_payment' | 'completed';

export function CourseEnrollment({ course, onEnroll, onCancel }: CourseEnrollmentProps) {
  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [extraData, setExtraData] = useState<PaymentExtraData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const paymentRef = useRef<PaymentMethodsHandle>(null);

  const handleVerified = useCallback(() => {
    setPhase('completed');
  }, []);

  const handlePaymentStatusChange = useCallback(
    (status: PaymentTransactionState | null) => {
      if (status === 'COMPLETED') setPhase('completed');
      if (status === 'FAILED') {
        setPhase('form');
        setError('Your payment could not be confirmed. Please select a payment method and try again.');
      }
    },
    []
  );

  const handleEnroll = async () => {
    if (!selectedPayment) {
      setError('Please select a payment method');
      return;
    }

    const validationError = paymentRef.current?.validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = (await onEnroll(course.id, selectedPayment, extraData)) as EnrollResult | void;

      if (course.price === 0) {
        setPhase('completed');
        return;
      }

      // A completed/redirected payment is handled by the parent; otherwise keep the
      // student on this screen so the live status indicator can take over.
      if (result?.transaction?.status === 'COMPLETED') {
        setPhase('completed');
        return;
      }

      setPhase('awaiting_payment');
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card padding="md" className="w-full max-w-full">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === 'review' ? 'text-navy' : 'text-grey-medium'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'review' ? 'bg-navy text-white' : 'bg-grey-light'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Review</span>
        </div>
        <div className="flex-1 h-0.5 bg-grey-light" />
        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-navy' : 'text-grey-medium'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'payment' ? 'bg-navy text-white' : 'bg-grey-light'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">Payment</span>
        </div>
      </div>

      {phase === 'completed' ? (
        <div className="space-y-5 text-center py-4">
          <CheckCircle2 size={48} className="text-green mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-navy">You are enrolled!</h3>
            <p className="text-sm text-grey-dark mt-1">
              Your payment was confirmed and <span className="font-medium text-navy">{course.title}</span> is now in
              your library.
            </p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={onCancel}>
            Start Learning
          </Button>
        </div>
      ) : phase === 'awaiting_payment' ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-navy">Payment initiated</h3>
            <p className="text-sm text-grey-dark mt-1">
              Keep this window open — this panel updates automatically when your payment is confirmed.
            </p>
          </div>

          <PaymentStatusIndicator
            courseId={course.id}
            onStatusChange={handlePaymentStatusChange}
            onVerified={handleVerified}
          />

          <Button variant="outline" fullWidth onClick={onCancel}>
            Close and check later
          </Button>
        </div>
      ) : step === 'review' ? (
        <div className="space-y-6">
          {/* Course Summary */}
          <div className="bg-grey-light/50 rounded-xl p-6">
            <h3 className="font-semibold text-navy mb-3">Course Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-grey-medium">Course</span>
                <span className="font-medium text-navy">{course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grey-medium">Subject</span>
                <Badge variant="info" size="sm">{course.subject}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-grey-medium">Instructor</span>
                <span>{course.instructor.user.fullName}</span>
              </div>
              <div className="border-t border-grey-light pt-2 mt-2 flex justify-between">
                <span className="font-medium text-navy">Total</span>
                <span className="text-xl font-bold text-navy">
                  {course.price === 0 ? 'Free' : formatCurrency(course.price)}
                </span>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-3">
            <h4 className="font-semibold text-navy">What's Included</h4>
            {[
              'Full lifetime access to course content',
              'Access on mobile and desktop',
              'Practice quizzes and exercises',
              'Certificate of completion',
              'Community discussion forums',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-grey-dark">
                <Check size={16} className="text-green flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Shield size={20} className="text-green" />
            <div>
              <p className="text-sm font-medium text-green-800">7-Day Money-Back Guarantee</p>
              <p className="text-xs text-green-700">Not satisfied? Get a full refund within 7 days.</p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight size={18} />}
            onClick={() => setStep('payment')}
          >
            {course.price === 0 ? 'Enroll for Free' : `Continue to Payment`}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Methods */}
          <PaymentMethods
            ref={paymentRef}
            amount={course.price}
            selectedMethod={selectedPayment}
            onSelect={(methodId, methodExtraData) => {
              setSelectedPayment(methodId);
              setExtraData(methodExtraData ?? {});
              setError('');
            }}
          />

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-grey-medium">
            <Shield size={14} className="shrink-0" />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setStep('review')} className="w-full sm:w-auto shrink-0">
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="min-w-0"
              loading={isProcessing}
              onClick={handleEnroll}
              disabled={!selectedPayment || isProcessing}
            >
              <span className="truncate">
                {course.price === 0 ? 'Confirm Enrollment' : `Pay ${formatCurrency(course.price)}`}
              </span>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-grey-medium">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Instant Access
            </span>
            <span className="flex items-center gap-1">
              <Shield size={12} /> Secure Payment
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}