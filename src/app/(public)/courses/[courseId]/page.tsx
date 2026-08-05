import { notFound } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { PublicCourseDetails } from './course-details-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Course Details | StudyHub',
  description: 'View course details and enroll',
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const courseData = await prisma.course.findUnique({
    where: { id: courseId, status: 'APPROVED' },
    include: {
      instructor: {
        select: {
          id: true,
          bio: true,
          rating: true,
          studentsCount: true,
          coursesCount: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      },
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          contentType: true,
          duration: true,
          isPreview: true,
        },
      },
      reviews: {
        include: {
          student: {
            include: {
              user: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: {
        select: {
          enrollments: true,
          modules: true,
          reviews: true,
        },
      },
    },
  });

  if (!courseData || !courseData.instructor) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Course Not Found</h2>
          <p className="text-grey-dark mb-4">
            The course you are looking for does not exist or has been removed.
          </p>
          <Link href="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const course = {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description ?? undefined,
    subject: courseData.subject,
    examBoard: courseData.examBoard ?? undefined,
    grade: courseData.grade ?? undefined,
    price: courseData.price,
    thumbnail: courseData.thumbnail ?? undefined,
    rating: courseData.rating,
    reviewsCount: courseData._count.reviews,
    studentsCount: courseData._count.enrollments,
    duration: courseData.duration ?? 0,
    modulesCount: courseData._count.modules,
    language: courseData.language ?? 'en',
    tags: courseData.tags ?? [],
    publishedAt: courseData.publishedAt ?? undefined,
    instructor: {
      id: courseData.instructor.id,
      user: {
        fullName: courseData.instructor.user.fullName,
        avatar: courseData.instructor.user.avatar ?? undefined,
        bio: courseData.instructor.bio ?? undefined,
      },
      rating: courseData.instructor.rating,
      studentsCount: courseData.instructor.studentsCount,
      coursesCount: courseData.instructor.coursesCount,
    },
    modules: courseData.modules.map((m) => ({
      ...m,
      contentType: m.contentType as any,
      duration: m.duration ?? 0,
    })),
    reviews: courseData.reviews.map((r) => ({
      id: r.id,
      studentName: r.student.user.fullName,
      rating: r.rating,
      comment: r.comment ?? undefined,
      createdAt: r.createdAt,
    })),
  };

  return (
    <div className="min-h-screen bg-grey-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PublicCourseDetails course={course} />
      </div>
    </div>
  );
}
