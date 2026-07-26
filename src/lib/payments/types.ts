import { PaymentMethod, TransactionStatus } from '@/types/subscription';

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  metadata?: PaymentMetadata;
}

export interface PaymentMetadata {
  type?: string;
  phone?: string;
  email?: string;
  name?: string;
  description?: string;
  subscriptionId?: string;
  courseId?: string;
  eventId?: string;
  instructorId?: string;
  bank?: string;
  [key: string]: any;
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
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

export interface PaymentProvider {
  name: string;
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  handleWebhook(payload: any): Promise<void>;
  refundPayment?(transactionId: string, amount?: number): Promise<RefundResult>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  message?: string;
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

export interface RevenueSplit {
  transactionId: string;
  instructorId: string;
  amount: number;
  platformFee: number;
  instructorEarnings: number;
  revenueSplit: number;
}