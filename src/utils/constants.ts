/**
 * Application constants for StudyHub Malawi
 */

export const APP_NAME = 'StudyHub Malawi';
export const APP_TAGLINE = 'Learn. Practice. Succeed.';
export const APP_DESCRIPTION = 'Malawi\'s digital learning and examination platform';
export const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://studyhub.mw';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.studyhub.mw';
export const SUPPORT_EMAIL = 'support@studyhub.mw';
export const SUPPORT_PHONE = '+265 888 000 000';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const PAYMENT_METHODS = {
  AIRTEL_MONEY: {
    name: 'Airtel Money',
    icon: '/icons/airtel-money.png',
    color: '#ED1C24',
  },
  TNM_MPAMBA: {
    name: 'TNM Mpamba',
    icon: '/icons/tnm-mpamba.png',
    color: '#00529B',
  },
  PAYCHANGU: {
    name: 'Card Payment',
    icon: '/icons/card.png',
    color: '#16A34A',
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer',
    icon: '/icons/bank.png',
    color: '#0D1B3D',
  },
} as const;

export const SUBSCRIPTION_TIERS = {
  STUDENT_BASIC: {
    name: 'Student Basic',
    monthlyPrice: 5000,
    features: ['limited_courses', 'basic_quizzes', 'past_papers'],
  },
  STUDENT_PREMIUM: {
    name: 'Student Premium',
    monthlyPrice: 10000,
    features: ['all_courses', 'ai_tutor', 'live_classes', 'mock_exams', 'certificates'],
  },
  STUDENT_ANNUAL: {
    name: 'Annual Student',
    annualPrice: 50000,
    features: ['all_courses', 'ai_tutor', 'live_classes', 'mock_exams', 'certificates', 'priority_support'],
  },
} as const;

export const INSTITUTION_TIERS = {
  BRONZE: {
    name: 'Bronze',
    monthlyPrice: 100000,
    maxStudents: 200,
    features: ['basic_lms', 'student_reports', 'teacher_accounts'],
  },
  SILVER: {
    name: 'Silver',
    monthlyPrice: 250000,
    maxStudents: 500,
    features: ['advanced_lms', 'custom_branding', 'ai_reports', 'bulk_enrollment'],
  },
  GOLD: {
    name: 'Gold',
    monthlyPrice: 500000,
    maxStudents: Infinity,
    features: ['full_lms', 'api_access', 'parent_dashboard', 'white_label'],
  },
} as const;

export const NOTIFICATION_TYPES = {
  PAYMENT_CONFIRMATION: {
    priority: 'high',
    channels: ['EMAIL', 'SMS', 'PUSH'],
  },
  OTP_VERIFICATION: {
    priority: 'high',
    channels: ['EMAIL', 'SMS'],
    expiryMinutes: 10,
  },
  EXAM_RESULT: {
    priority: 'high',
    channels: ['EMAIL', 'PUSH'],
  },
  CLASS_REMINDER: {
    priority: 'high',
    channels: ['EMAIL', 'PUSH'],
  },
  WELCOME: {
    priority: 'low',
    channels: ['EMAIL'],
  },
} as const;

export const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'] as const;
export const SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Biology',
  'Chemistry',
  'Geography',
  'History',
  'Agriculture',
  'Computer Studies',
  'Business Studies',
] as const;

export const GRADES = ['Form 1', 'Form 2', 'Form 3', 'Form 4'] as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  SUBSCRIPTION: (userId: string) => `user:${userId}:subscription`,
  COURSE: (courseId: string) => `course:${courseId}`,
  INSTITUTION: (institutionId: string) => `institution:${institutionId}`,
  ANALYTICS_DASHBOARD: 'analytics:dashboard',
} as const;