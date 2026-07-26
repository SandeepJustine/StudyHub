/**
 * Complete pricing configuration for all subscription tiers
 */

export interface TierConfig {
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: string[];
  limits: {
    students?: number;
    courses?: number;
    storage?: number; // MB
    apiCalls?: number;
    liveClasses?: number;
  };
  revenueShare?: number;
  platformFee?: number;
}

export const PRICING_TIERS: Record<string, TierConfig> = {
  // Student Plans
  STUDENT_BASIC: {
    name: 'Student Basic',
    description: 'Start your learning journey with essential features',
    monthlyPrice: 5000,
    annualPrice: null,
    features: [
      'Access to limited courses',
      'Basic quizzes and exercises',
      'Past papers access',
      'Community forum access',
      'Progress tracking',
    ],
    limits: {
      courses: 3,
      storage: 500,
      liveClasses: 0,
    },
  },

  STUDENT_PREMIUM: {
    name: 'Student Premium',
    description: 'Unlock full learning potential with premium features',
    monthlyPrice: 10000,
    annualPrice: null,
    features: [
      'Unlimited course access',
      'AI Tutor assistance',
      'Live class participation',
      'Mock examinations',
      'Digital certificates',
      'Priority support',
      'Downloadable content',
      'Advanced analytics',
    ],
    limits: {
      courses: -1, // unlimited
      storage: 5000,
      liveClasses: -1,
    },
  },

  STUDENT_ANNUAL: {
    name: 'Student Annual',
    description: 'Best value - save MWK 70,000 per year',
    monthlyPrice: null,
    annualPrice: 50000,
    features: [
      'All Premium features',
      'Save 58% compared to monthly',
      'Early access to new features',
      'Exclusive webinars',
      'Priority certificate processing',
    ],
    limits: {
      courses: -1,
      storage: 10000,
      liveClasses: -1,
    },
  },

  // Professional Board Plans
  ICAM: {
    name: 'ICAM Professional',
    description: 'Specialized for ICAM examination preparation',
    monthlyPrice: 15000,
    annualPrice: null,
    features: [
      'ICAM-specific curriculum',
      'Professional mock exams',
      'Industry case studies',
      'Career guidance',
      'Networking events',
    ],
    limits: {
      courses: -1,
      storage: 5000,
      liveClasses: -1,
    },
  },

  PROFESSIONAL_BOARD: {
    name: 'Professional Board',
    description: 'For TEVETA and other professional examinations',
    monthlyPrice: 15000,
    annualPrice: null,
    features: [
      'Board-specific content',
      'Professional certifications',
      'Industry partnerships',
      'Job placement assistance',
    ],
    limits: {
      courses: -1,
      storage: 5000,
      liveClasses: -1,
    },
  },

  // Institution Plans
  INSTITUTION_BRONZE: {
    name: 'Institution Bronze',
    description: 'Essential digital learning tools for schools',
    monthlyPrice: 100000,
    annualPrice: null,
    features: [
      'Up to 200 students',
      'Basic LMS features',
      'Student progress reports',
      'Teacher accounts',
      'Content library access',
      'Email support',
    ],
    limits: {
      students: 200,
      storage: 10000,
      courses: 50,
    },
  },

  INSTITUTION_SILVER: {
    name: 'Institution Silver',
    description: 'Advanced features for growing institutions',
    monthlyPrice: 250000,
    annualPrice: null,
    features: [
      'Up to 500 students',
      'Advanced LMS',
      'Custom branding',
      'AI-powered reports',
      'Bulk enrollment',
      'Advanced analytics',
      'Priority support',
    ],
    limits: {
      students: 500,
      storage: 50000,
      courses: 200,
      apiCalls: 100000,
    },
  },

  INSTITUTION_GOLD: {
    name: 'Institution Gold',
    description: 'Enterprise-grade solution for large institutions',
    monthlyPrice: 500000,
    annualPrice: null,
    features: [
      'Unlimited students',
      'Full LMS suite',
      'API access',
      'Parent dashboard',
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    limits: {
      students: -1, // unlimited
      storage: 200000,
      courses: -1,
      apiCalls: -1,
      liveClasses: -1,
    },
  },

  // Instructor Plans
  INSTRUCTOR_FREE: {
    name: 'Instructor Free',
    description: 'Start teaching and earning',
    monthlyPrice: 0,
    annualPrice: null,
    features: [
      'Create and sell courses',
      'Basic analytics',
      'Student management',
      'Community access',
    ],
    limits: {
      courses: 5,
      storage: 1000,
    },
    revenueShare: 0.70, // 70% to instructor
    platformFee: 0.30,   // 30% to platform
  },

  INSTRUCTOR_PRO: {
    name: 'Instructor Pro',
    description: 'Maximize your teaching potential',
    monthlyPrice: 25000,
    annualPrice: null,
    features: [
      'Unlimited courses',
      'Advanced analytics',
      'Priority listing',
      'Marketing tools',
      'Custom coupons',
      'Dedicated support',
    ],
    limits: {
      courses: -1,
      storage: 50000,
    },
    revenueShare: 0.80, // 80% to instructor
    platformFee: 0.20,   // 20% to platform
  },
};

/**
 * Get pricing for a specific tier and billing cycle
 */
export function getTierPricing(tier: string, cycle: 'MONTHLY' | 'ANNUAL'): number {
  const config = PRICING_TIERS[tier];
  if (!config) throw new Error(`Invalid tier: ${tier}`);

  const price = cycle === 'MONTHLY' ? config.monthlyPrice : config.annualPrice;
  if (price === null) throw new Error(`${tier} does not support ${cycle} billing`);

  return price;
}

/**
 * Check if a feature is available for a given tier
 */
export function hasFeature(tier: string, feature: string): boolean {
  const config = PRICING_TIERS[tier];
  return config?.features.includes(feature) || false;
}

/**
 * Get the limit for a specific resource in a tier
 */
export function getTierLimit(tier: string, resource: string): number {
  const config = PRICING_TIERS[tier];
  return config?.limits?.[resource as keyof typeof config.limits] ?? 0;
}

/**
 * Calculate proration for plan changes
 */
export function calculateProration(
  currentTier: string,
  newTier: string,
  remainingDays: number,
  cycle: 'MONTHLY' | 'ANNUAL'
): { credit: number; charge: number; netAmount: number } {
  const currentPrice = getTierPricing(currentTier, cycle);
  const newPrice = getTierPricing(newTier, cycle);

  const totalDays = cycle === 'MONTHLY' ? 30 : 365;
  const dailyRate = currentPrice / totalDays;
  const credit = Math.floor(dailyRate * remainingDays);

  // Charge for new plan (full price minus credit)
  const charge = newPrice;
  const netAmount = charge - credit;

  return {
    credit,
    charge,
    netAmount: Math.max(0, netAmount),
  };
}

/**
 * Get all available tiers for a user role
 */
export function getTiersForRole(role: string): string[] {
  const tierMap: Record<string, string[]> = {
    STUDENT: ['STUDENT_BASIC', 'STUDENT_PREMIUM', 'STUDENT_ANNUAL', 'ICAM', 'PROFESSIONAL_BOARD'],
    SCHOOL_ADMIN: ['INSTITUTION_BRONZE', 'INSTITUTION_SILVER', 'INSTITUTION_GOLD'],
    INSTRUCTOR: ['INSTRUCTOR_FREE', 'INSTRUCTOR_PRO'],
  };

  return tierMap[role] || [];
}