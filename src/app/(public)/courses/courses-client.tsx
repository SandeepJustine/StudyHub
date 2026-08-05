'use client';

import { useRouter } from 'next/navigation';
import { CourseList } from '@/components/features/course';

interface PublicCoursesClientProps {
  courses: any[];
}

export function PublicCoursesClient({ courses }: PublicCoursesClientProps) {
  const router = useRouter();

  const handleEnroll = (courseId: string) => {
    router.push('/auth/register?role=student');
  };

  const handleView = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <CourseList
      courses={courses}
      showFilters={true}
      onEnroll={handleEnroll}
      onView={handleView}
      emptyMessage="No courses have been published yet"
    />
  );
}
