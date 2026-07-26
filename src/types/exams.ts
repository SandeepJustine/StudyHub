import { PaginatedResponse } from './common';
import { QuestionType } from './course';

/**
 * Represents a student's single attempt at an exam (quiz).
 */
export interface ExamAttempt {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date | null;
  timeSpent?: number | null; // in seconds
  answers: Record<string, any>; // JSON of student's answers
  attemptNumber: number;
  certificateId?: string | null;
}

/**
 * Represents the data returned when an exam is started.
 */
export interface StartedExam {
  attempt: ExamAttempt;
  questions: StrippedQuestion[];
  timeLimit?: number | null;
  totalQuestions: number;
  totalPoints: number;
  passingScore: number;
}

/**
 * Represents a question as it is sent to the student during an exam.
 * Correct answers and explanations are stripped.
 */
export interface StrippedQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: Array<{ text: string; id: string }>; // Only text and an id for the option
  points: number;
  order: number;
}

/**
 * Represents the structure for submitting exam answers.
 * The key is the questionId.
 */
export type ExamAnswers = Record<string, string | string[]>;

/**
 * Represents the detailed result of grading a single question.
 */
export interface GradingDetail {
  questionId: string;
  correct: boolean;
  points: number;
  maxPoints: number;
  correctAnswer: any;
  studentAnswer: any;
}

/**
 * Represents the overall result of grading an entire exam attempt.
 */
export interface GradingResult {
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  details: GradingDetail[];
}

/**
 * Represents the data returned after submitting an exam.
 */
export interface SubmittedExamResult {
  attempt: ExamAttempt;
  result: GradingResult;
  certificate?: any; // Should be Certificate type
}

/**
* Represents analytics for a specific quiz.
*/
export interface ExamAnalytics {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number; // in seconds
  passingScore: number;
}

/**
 * Represents a single entry in a student's exam history.
 */
export interface StudentExamHistoryEntry extends ExamAttempt {
  quiz: {
    title: string;
    module: {
      course: {
        title: string;
        subject: string;
      };
    };
  };
  certificate?: {
    id: string;
    verificationId: string;
    type: string;
  } | null;
}

/**
 * Represents the paginated response for a student's exam history.
 */
export type PaginatedStudentExamHistory = PaginatedResponse<StudentExamHistoryEntry>;