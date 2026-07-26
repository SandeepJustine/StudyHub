import { PaginatedResponse } from './common';

/**
 * Represents a student's enrollment in a course, with relevant course and instructor details.
 * This is the data structure returned by `enrollmentService.getStudentEnrollments`.
 */
export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
  completedAt?: Date | null;
  progress: number; // Percentage completion
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED'; // Assuming these statuses
  course: {
    id: string;
    title: string;
    subject: string;
    thumbnail?: string | null;
    instructor: {
      id: string;
      user: {
        fullName: string;
      };
    };
  };
}

/**
 * Represents a paginated response for student enrollments.
 */
export type PaginatedStudentEnrollments = PaginatedResponse<StudentEnrollment>;