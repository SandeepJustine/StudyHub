import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { CourseDetailsPage } from './course-details-page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);
  
  const { courseId } = await params;

  const student = await prisma.student.findUnique({ 
    where: { userId: session.user.id }, 
    select: { id: true, userId: true, wishlist: true } 
  });
  if (!student) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <p>Student profile not found.</p>
      </div>
    );
  }

  const courseData = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
          _count: {
            select: { courses: true }
          }
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
      _count: { select: { enrollments: true, modules: true, reviews: true } },
    },
  });

  if (!courseData || !courseData.instructor) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Course Not Found</h2>
          <p className="text-grey-dark mb-4">The course you are looking for does not exist or has been removed.</p>
          <Link href="/student/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: student.id, courseId } });

  const pendingTransaction = await prisma.transaction.findFirst({
    where: {
      courseId,
      userId: student.userId,
      status: 'PENDING',
    },
  });

  let enrollmentStatus: 'not_enrolled' | 'enrolled' | 'completed' | 'payment_pending' = 'not_enrolled';
  if (enrollment) {
    enrollmentStatus = enrollment.completedAt ? 'completed' : 'enrolled';
  } else if (pendingTransaction) {
    enrollmentStatus = 'payment_pending';
  }

  const hasReviewed = courseData.reviews.some(r => r.studentId === student.id);

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
      coursesCount: courseData.instructor._count.courses,
    },
    modules: courseData.modules.map(m => ({
      ...m,
      contentType: m.contentType as any,
      duration: m.duration ?? 0,
    })),
    reviews: courseData.reviews.map(r => ({
      id: r.id,
      studentName: r.student.user.fullName,
      rating: r.rating,
      comment: r.comment ?? undefined,
      createdAt: r.createdAt,
    })),
  };

  const isFavorite = student.wishlist.includes(courseId);

  return (
    <div className="min-h-screen bg-grey-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CourseDetailsPage
          course={course}
          enrollmentStatus={enrollmentStatus}
          enrollmentProgress={enrollment?.progress ?? 0}
          isFavorite={isFavorite}
          hasReviewed={hasReviewed}
        />
      </div>
    </div>
  );
}