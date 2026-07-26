export type SubscriptionTier =
  | 'STUDENT_BASIC'
  | 'STUDENT_PREMIUM'
  | 'STUDENT_ANNUAL'
  | 'ICAM'
  | 'PROFESSIONAL_BOARD'
  | 'INSTITUTION_BRONZE'
  | 'INSTITUTION_SILVER'
  | 'INSTITUTION_GOLD'
  | 'INSTRUCTOR_FREE'
  | 'INSTRUCTOR_PRO';

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod =
  | 'AIRTEL_MONEY'
  | 'TNM_MPAMBA'
  | 'PAYCHANGU'
  | 'VISA'
  | 'MASTERCARD'
  | 'BANK_TRANSFER'
  | 'SCHOOL_INVOICE';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number | null;
  };
  features: string[];
  limits: {
    students?: number;
    courses?: number;
    storage?: number;
    apiCalls?: number;
  };
  revenueShare?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  institutionId?: string;
  tier: SubscriptionTier;
  cycle: BillingCycle;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  amount: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  issuedAt: Date;
  paidAt?: Date;
  dueDate: Date;
  invoiceUrl?: string;
}

export interface SubscriptionAnalytics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  averageLifetime: number;
  plans: {
    tier: SubscriptionTier;
    count: number;
    revenue: number;
    growth: number;
  }[];
}

export interface ProrationCalculation {
  originalPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  remainingDays: number;
  credit: number;
  charge: number;
  netAmount: number;
  effectiveDate: Date;
}

export interface FeatureAccess {
  canAccessCourse: boolean;
  canAccessExam: boolean;
  canUseAI: boolean;
  canJoinLiveClass: boolean;
  canDownloadContent: boolean;
  maxStudents: number;
  maxCourses: number;
  hasAPIAccess: boolean;
  hasParentPortal: boolean;
  hasCustomBranding: boolean;
}