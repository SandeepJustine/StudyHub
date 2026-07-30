'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseDetails } from '@/components/features/course/course-details';
import { CourseEnrollment } from '@/components/features/course/course-enrollment';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';

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

interface CourseDetailsPageProps {
  course: {
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
  };
  enrollmentStatus: 'not_enrolled' | 'enrolled' | 'completed';
  enrollmentProgress: number;
  isFavorite: boolean;
}

export function CourseDetailsPage({ course, enrollmentStatus, enrollmentProgress, isFavorite: initialIsFavorite }: CourseDetailsPageProps) {
  const router = useRouter();
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleEnroll = () => {
    if (course.price > 0) {
      setShowEnrollment(true);
    } else {
      enrollCourse();
    }
  };

  const enrollCourse = async (paymentMethod?: string) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enrollment failed');

      setToast({ message: 'Successfully enrolled! You can start learning now.', type: 'success' });
      setShowEnrollment(false);
      router.refresh();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleContinue = () => {
    router.push(`/student/courses/${course.id}/learn`);
  };

  const handleStartModule = (moduleId: string) => {
    router.push(`/student/courses/${course.id}/learn?module=${moduleId}`);
  };

  const handleToggleFavorite = async () => {
    // Here you would add an API call to update the user's wishlist
    setIsFavorite(!isFavorite);
    setToast({
      message: !isFavorite ? 'Added to your wishlist!' : 'Removed from your wishlist.',
      type: 'success',
    });
    // Example API call:
    // await fetch(`/api/student/wishlist`, { method: 'POST', body: JSON.stringify({ courseId: course.id }) });
    router.refresh();
  };

  return (
    <>
      <CourseDetails
        course={course}
        enrollmentStatus={enrollmentStatus}
        enrollmentProgress={enrollmentProgress}
        onEnroll={handleEnroll}
        onContinue={handleContinue}
        onStartModule={handleStartModule}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <Modal isOpen={showEnrollment} onClose={() => setShowEnrollment(false)} title={`Enroll in "${course.title}"`} size="lg">
        <CourseEnrollment
          course={course}
          onEnroll={enrollCourse}
          onCancel={() => setShowEnrollment(false)}
        />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}