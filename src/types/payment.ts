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
  metadata?: Record<string, any>;
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

// types/payment.ts - Create this file if it doesn't exist

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  providerReference?: string;
  redirectUrl?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerification {
  verified: boolean;
  status: TransactionStatus;
  providerReference?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  amount: number;
  transactionId?: string;
  message?: string;
}


export interface PaymentRequest {
  amount: number;
  currency?: string;
  method: string;
  metadata?: {
    reference?: string;
    email?: string;
    name?: string;
    phone?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardholderName?: string;
    mobileMoneyOperatorRefId?: string;
    operatorRefId?: string;
    [key: string]: any;
  };
}

export interface PaymentProvider {
  name: string;
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  handleWebhook(payload: any): Promise<void>;
}

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
  [key: string]: any;
}

// ─── Payment Provider Interface ────────────────────────────────

export interface PaymentProvider {
  name: string;
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  handleWebhook(payload: any): Promise<void>;
}

// ─── Payment Request ──────────────────────────────────────────

export interface PaymentRequest {
  amount: number;
  currency?: string;
  method: string;
  metadata?: {
    reference?: string;
    email?: string;
    name?: string;
    phone?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardholderName?: string;
    mobileMoneyOperatorRefId?: string;
    operatorRefId?: string;
    [key: string]: any;
  };
}

// ─── Payment Result ───────────────────────────────────────────

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  providerReference?: string;
  redirectUrl?: string;
  message?: string;
  metadata?: Record<string, any>;
}

// ─── Payment Verification ─────────────────────────────────────

export interface PaymentVerification {
  verified: boolean;
  status: TransactionStatus;
  providerReference?: string;
  metadata?: Record<string, any>;
}

// ─── Refund Result ────────────────────────────────────────────

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  transactionId?: string;
  message?: string;
}

// ─── Payment Method Config ────────────────────────────────────

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

// ─── Payout Types ─────────────────────────────────────────────

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

// ─── Revenue Share ────────────────────────────────────────────

export interface RevenueShare {
  transactionId: string;
  instructorId: string;
  amount: number;
  platformFee: number;
  instructorEarnings: number;
  revenueSplit: number;
  calculatedAt: Date;
}