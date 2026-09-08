export type TrainingCategory =
  | 'EXCEL'
  | 'LEADERSHIP'
  | 'CYBERSECURITY'
  | 'DATA_ANALYSIS'
  | 'PROJECT_MANAGEMENT'
  | 'COMMUNICATION'
  | 'FINANCE'
  | 'MARKETING'
  | 'HR_MANAGEMENT'
  | 'CUSTOMER_SERVICE'
  | 'SALES'
  | 'CODING'
  | 'DESIGN'
  | 'COMPLIANCE'
  | 'OTHER';

export type TrainingMode =
  | 'ONLINE'
  | 'IN_PERSON'
  | 'HYBRID';

export type TrainingLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'ALL_LEVELS';

export type TrainingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  topics: string[];
  activities?: string[];
  assessment?: {
    type: 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'EXAM';
    passingScore: number;
  };
}

export interface TrainingSchedule {
  days: string[];
  time: string;
  timezone: string;
}

export interface TrainingLocation {
  venue: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
}

export interface TrainingRequirements {
  minEducation?: string;
  minExperience?: string;
  requiredSkills?: string[];
  requiredEquipment?: string[];
  requiredSoftware?: string[];
}

export interface CorporateTrainingPackage {
  id: string;
  corporateId: string;
  title: string;
  description: string;
  category: TrainingCategory;
  mode: TrainingMode;
  level: TrainingLevel;

  pricePerParticipant: number;
  minimumParticipants: number;
  maximumParticipants: number;
  totalBudget: number;
  currency: string;

  startDate: Date;
  endDate: Date;
  durationDays: number;
  schedule?: TrainingSchedule;

  curriculum: TrainingModule[];
  prerequisites?: string[];
  learningOutcomes: string[];
  materialsProvided: string[];
  certificationIncluded: boolean;

  instructorId?: string;
  instructorName?: string;
  instructorBio?: string;

  location?: TrainingLocation;

  onlinePlatform?: 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'STUDYHUB';
  meetingLink?: string;

  requirements: TrainingRequirements;

  status: TrainingStatus;
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;

  enrolledCount: number;
  completionRate: number;
  averageRating: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CorporateClient {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  companySize: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  contactPerson: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
  };
  billingInfo: {
    vatNumber?: string;
    billingAddress: string;
    paymentMethod: string;
    creditLimit?: number;
  };
  trainings: CorporateTrainingPackage[];
  activeContracts: number;
  totalSpent: number;
  createdAt: Date;
}
