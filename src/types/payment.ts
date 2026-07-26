import { PaymentMethod, TransactionStatus } from './subscription';

export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  status: TransactionStatus;
  metadata?: PaymentMetadata;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentMetadata {
  phone?: string;
  email?: string;
  name?: string;
  description?: string;
  subscriptionId?: string;
  courseId?: string;
  instructorId?: string;
  eventId?: string;
  type?: 'subscription' | 'course' | 'event' | 'certificate' | 'job_posting';
  bank?: string;
  requiresReconciliation?: boolean;
}

export interface PaymentProvider {
  name: string;
  initiatePayment(transaction: PaymentTransaction): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  handleWebhook(payload: any): Promise<void>;
  refundPayment?(transactionId: string, amount?: number): Promise<RefundResult>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  message?: string;
  providerReference?: string;
}

export interface PaymentVerification {
  verified: boolean;
  status: TransactionStatus;
  providerReference?: string;
  metadata?: any;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  message?: string;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  settlementTime: string;
}

export interface PayoutRequest {
  instructorId: string;
  amount: number;
  period: string;
  method: PaymentMethod;
  accountDetails: {
    phone?: string;
    bankAccount?: string;
    bankName?: string;
    accountName?: string;
  };
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  transactionReference?: string;
  message?: string;
}

export interface RevenueShare {
  transactionId: string;
  instructorId: string;
  amount: number;
  platformFee: number;
  instructorEarnings: number;
  revenueSplit: number;
  calculatedAt: Date;
}