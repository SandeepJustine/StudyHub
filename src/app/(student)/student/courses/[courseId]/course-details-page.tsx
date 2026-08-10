'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CourseDetails } from '@/components/features/course/course-details';
import { CourseEnrollment } from '@/components/features/course/course-enrollment';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

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
  enrollmentStatus: 'not_enrolled' | 'enrolled' | 'completed' | 'payment_pending';
  enrollmentProgress: number;
  isFavorite: boolean;
  hasReviewed?: boolean;
  onSubmitReview?: (rating: number, comment: string, isAnonymous: boolean) => Promise<void>;
}

export function CourseDetailsPage({ course, enrollmentStatus, enrollmentProgress, isFavorite: initialIsFavorite, hasReviewed, onSubmitReview }: CourseDetailsPageProps) {
  const router = useRouter();
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(hasReviewed || false);

  const handleEnroll = () => {
    if (course.price > 0) {
      setShowEnrollment(true);
    } else {
      enrollCourse(course.id);
    }
  };

  const enrollCourse = async (courseId: string, paymentMethod?: string, phone?: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Enrollment failed');

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.transaction) {
        if (data.transaction.status === 'COMPLETED') {
          setToast({ message: 'Payment successful! You are now enrolled.', type: 'success' });
        } else if (data.transaction.status === 'PENDING') {
          setToast({ message: 'Payment initiated. You will be enrolled once payment is confirmed.', type: 'success' });
        }
      } else {
        setToast({ message: 'Successfully enrolled! You can start learning now.', type: 'success' });
      }

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
    setIsFavorite(!isFavorite);
    setToast({
      message: !isFavorite ? 'Added to your wishlist!' : 'Removed from your wishlist.',
      type: 'success',
    });
    router.refresh();
  };

  const handleSubmitReview = useCallback(async (rating: number, comment: string, isAnonymous: boolean) => {
    if (!onSubmitReview) return;
    await onSubmitReview(rating, comment, isAnonymous);
    setReviewSubmitted(true);
    setToast({ message: 'Review submitted successfully!', type: 'success' });
  }, [onSubmitReview]);

  if (enrollmentStatus === 'payment_pending') {
    return (
      <div className="min-h-screen bg-grey-light">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-navy mb-3">Payment Pending</h2>
            <p className="text-grey-dark mb-2">
              You have a pending payment for this course. Please complete your payment to access the course content.
            </p>
            <p className="text-sm text-grey-medium mb-6">
              Once payment is confirmed, you will be able to start learning immediately.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => router.push(`/student/courses/${course.id}/learn`)}>
                Try Accessing Course
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        onSubmitReview={reviewSubmitted ? undefined : handleSubmitReview}
        hasReviewed={reviewSubmitted}
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