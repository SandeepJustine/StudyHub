export interface CourseData {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description?: string;
  subject: string;
  examBoard?: string;
  grade?: string;
  price: number;
  status: CourseStatus;
  thumbnail?: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  modulesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  contentType: ContentType;
  contentUrl?: string;
  duration?: number;
  isPreview: boolean;
  quiz?: QuizData;
}

export type ContentType = 'VIDEO' | 'NOTES' | 'QUIZ' | 'PAST_PAPER' | 'ASSIGNMENT';

export interface QuizData {
  id: string;
  moduleId: string;
  timeLimit?: number;
  passingScore: number;
  questionsCount: number;
  totalPoints: number;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  explanation?: string;
  points: number;
  order: number;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress: number;
  completedAt?: Date;
  enrolledAt: Date;
  certificateId?: string;
}

export interface CourseReview {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface CourseSearchParams {
  query?: string;
  subject?: string;
  examBoard?: string;
  grade?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  sortBy?: 'popularity' | 'rating' | 'price' | 'newest';
  page?: number;
  limit?: number;
}