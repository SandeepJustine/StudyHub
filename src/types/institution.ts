import { Address } from './common';
import { Subscription, SubscriptionTier } from './subscription';

/**
 * Represents the core data for an educational institution.
 * Aligns with the Prisma Institution model.
 */
export interface Institution {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  maxStudents: number;
  currentStudents: number;
  address?: Address | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  logo?: string | null;
  website?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents the branding settings for an institution.
 * Aligns with the Prisma InstitutionBranding model.
 */
export interface InstitutionBranding {
  institutionId: string;
  logo?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  customDomain?: string | null;
  customCss?: string | null;
}

/**
 * Represents a student as viewed from the institution portal.
 * This is the data structure returned by `institutionService.getStudents`.
 */
export interface InstitutionStudent {
  id: string; // This is the Student ID, not the User ID
  name: string;
  email: string;
  phone?: string | null;
  grade?: string | null;
  subjects: string[];
  enrollmentCount: number;
  averageProgress: number;
  lastActive?: Date | null;
}

/**
 * Represents the data structure for the institution's main dashboard.
 */
export interface InstitutionDashboardData {
  institution: {
    id: string;
    name: string;
    tier: SubscriptionTier;
    studentCount: number;
    maxStudents: number;
  };
  subscription: Pick<Subscription, 'status' | 'endDate' | 'autoRenew'> | null;
  stats: {
    totalStudents: number;
    totalCourses: number;
    averageCompletionRate: number;
    averageScore: number;
  };
  recentActivity: any[]; // TODO: Define a specific type for activity logs
}

/**
 * Payload for bulk enrolling students into an institution.
 */
export interface BulkEnrollmentPayload {
  email: string;
  name: string;
  grade?: string;
  subjects?: string[];
  courseIds?: string[];
}

/**
 * Represents progress report data for a single student within an institution.
 * This is the data structure returned by `institutionService.getProgressReports`.
 */
export interface StudentProgressReport {
  studentId: string;
  name: string;
  grade?: string | null;
  subjects: string[];
  averageScore: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  recentExams: {
    exam: string;
    subject: string;
    score: number;
    passed: boolean;
    date?: Date | null;
  }[];
}