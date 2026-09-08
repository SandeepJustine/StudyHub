import { UserRole } from './common';
import { SubscriptionTier } from './subscription';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  locale: string;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile extends UserProfile {
  role: 'STUDENT';
  student: {
    id: string;
    grade?: string;
    examBoard?: string;
    subjects: string[];
    institutionId?: string;
    parentLinks: ParentLink[];
  };
}

export interface SchoolAdminProfile extends UserProfile {
  role: 'SCHOOL_ADMIN';
  schoolAdmin: {
    id: string;
    institutionId: string;
    institution: InstitutionSummary;
    role: string;
  };
}

export interface InstructorProfile extends UserProfile {
  role: 'INSTRUCTOR';
  instructor: {
    id: string;
    bio?: string;
    expertise: string[];
    revenueShare: number;
    totalEarnings: number;
    coursesCount: number;
    studentsCount: number;
    rating: number;
  };
}

export interface CorporateClientProfile extends UserProfile {
  role: 'CORPORATE_CLIENT';
  corporateClient: {
    id: string;
    companyName: string;
    industry?: string;
    activeContracts: number;
    activePostings: number;
  };
}

export interface ParentProfile extends UserProfile {
  role: 'PARENT';
  parent: {
    id: string;
    phoneVerified: boolean;
    children: StudentLink[];
  };
}

export interface StudentLink {
  studentId: string;
  studentName: string;
  institutionName?: string;
  grade?: string;
  status: 'active' | 'inactive';
}

export interface ParentLink {
  id: string;
  parentId: string;
  status: string;
  createdAt: Date;
}

export interface InstitutionSummary {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  logo?: string;
  studentCount: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  types: {
    [key: string]: {
      enabled: boolean;
      channels: ('EMAIL' | 'SMS' | 'PUSH')[];
    };
  };
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  locale: string;
  institutionId?: string;
  permissions: string[];
}

export type AuthUser = UserSession;