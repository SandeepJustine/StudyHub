// Common utility types used across the application

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type Currency = 'MWK' | 'USD';
export type Locale = 'en' | 'ny';

export interface Address {
  street?: string;
  city: string;
  district?: string;
  region?: string;
  country: string;
  postalCode?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type Status = 'active' | 'inactive' | 'suspended' | 'deleted';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'STUDENT' 
  | 'INSTRUCTOR' 
  | 'SCHOOL_ADMIN' 
  | 'PLATFORM_ADMIN' 
  | 'PARENT'
  | 'CORPORATE_CLIENT';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  categoryId: string;
  price: number;
  status: CourseStatus;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number;
  completedAt?: Date;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  tier: InstitutionTier;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InstitutionType = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'CORPORATE';
export type InstitutionTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface Subscription {
  id: string;
  userId?: string;
  institutionId?: string;
  plan: SubscriptionPlan;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'STUDENT' | 'INSTRUCTOR' | 'INSTITUTION' | 'CORPORATE';
export type SubscriptionTier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  marks: number;
  order: number;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  certificateId?: string;
  completedAt: Date;
}

export interface Certificate {
  id: string;
  userId: string;
  examId?: string;
  courseId?: string;
  type: CertificateType;
  verificationId: string;
  issuedAt: Date;
  expiresAt?: Date;
}

export type CertificateType = 'EXAM' | 'COURSE' | 'ACHIEVEMENT';
