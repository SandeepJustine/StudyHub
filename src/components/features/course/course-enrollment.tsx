'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentMethods } from '@/components/features/payment/payment-methods';
import { 
  Check, 
  Shield, 
  Clock, 
  Smartphone,
  CreditCard,
  Building2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

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
  onEnroll: (courseId: string, paymentMethod: string, phone?: string) => void;
  onCancel: () => void;
}

export function CourseEnrollment({ course, onEnroll, onCancel }: CourseEnrollmentProps) {
  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async () => {
    if (!selectedPayment) {
      setError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onEnroll(course.id, selectedPayment, phone || undefined);
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-lg mx-auto">
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

      {step === 'review' ? (
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
            amount={course.price}
            selectedMethod={selectedPayment}
            onSelect={setSelectedPayment}
          />

          {/* Phone Number for Mobile Money */}
          {(selectedPayment === 'AIRTEL_MONEY' || selectedPayment === 'TNM_MPAMBA') && (
            <Input
              label={selectedPayment === 'AIRTEL_MONEY' ? 'Airtel Phone Number' : 'TNM Phone Number'}
              placeholder={selectedPayment === 'AIRTEL_MONEY' ? '+265 999 000 000' : '+265 888 000 000'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isProcessing}
              helperText={selectedPayment === 'AIRTEL_MONEY' ? 'Your Airtel Money registered phone number' : 'Your TNM Mpamba registered phone number'}
            />
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-grey-medium">
            <Shield size={14} />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('review')}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isProcessing}
              onClick={handleEnroll}
              disabled={!selectedPayment}
            >
              {course.price === 0 ? 'Confirm Enrollment' : `Pay ${formatCurrency(course.price)}`}
            </Button>
          </div>

          <div className="flex justify-center gap-4 text-xs text-grey-medium">
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