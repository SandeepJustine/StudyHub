'use client';

import { useRouter } from 'next/navigation';
import { CourseDetails } from '@/components/features/course/course-details';

interface Module {
  id: string;
  title: string;
  contentType: 'VIDEO' | 'AUDIO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT';
  duration?: number;
  isPreview: boolean;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  subject: string;
  examBoard?: string;
  grade?: string;
  price: number;
  thumbnail?: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  modulesCount: number;
  language: string;
  tags?: string[];
  publishedAt?: Date;
  instructor: {
    id: string;
    user: {
      fullName: string;
      avatar?: string;
      bio?: string;
    };
    rating: number;
    studentsCount: number;
    coursesCount: number;
  };
  modules: Module[];
  reviews?: Review[];
}

interface PublicCourseDetailsProps {
  course: Course;
}

export function PublicCourseDetails({ course }: PublicCourseDetailsProps) {
  const router = useRouter();

  const handleEnroll = () => {
    router.push('/auth/register?role=student');
  };

  const handleView = (moduleId: string) => {
    router.push('/auth/register?role=student');
  };

  return (
    <CourseDetails
      course={course}
      enrollmentStatus="not_enrolled"
      enrollmentProgress={0}
      onEnroll={handleEnroll}
      onContinue={handleView}
      onStartModule={handleView}
    />
  );
}
