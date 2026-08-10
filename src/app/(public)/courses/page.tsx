import { BookOpen } from 'lucide-react';
import prisma from '@/lib/utils/prisma';
import { PublicCoursesClient } from './courses-client';
import { PublicSponsorships } from '@/components/features/sponsorship/public-sponsorships';

export const metadata = {
  title: 'Courses | StudyHub',
  description: 'Browse courses from expert instructors across Malawi',
};

async function getApprovedCourses() {
  const courses = await prisma.course.findMany({
    where: { status: 'APPROVED' },
    include: {
      instructor: {
        select: {
          id: true,
          userId: true,
          rating: true,
          studentsCount: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
          modules: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description || undefined,
    subject: course.subject,
    examBoard: course.examBoard || undefined,
    grade: course.grade || undefined,
    price: course.price,
    thumbnail: course.thumbnail || undefined,
    rating: Number(course.rating) || 0,
    reviewsCount: course._count?.reviews || 0,
    studentsCount: course.studentsCount,
    duration: course.duration || 0,
    modulesCount: course._count?.modules || 0,
    status: course.status,
    instructor: course.instructor
      ? {
          id: course.instructor.id,
          user: {
            fullName: course.instructor.user.fullName,
            avatar: course.instructor.user.avatar || undefined,
          },
          rating: course.instructor.rating,
          studentsCount: course.instructor.studentsCount,
        }
      : undefined,
  }));
}

export default async function PublicCoursesPage() {
  const courses = await getApprovedCourses();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-green-100 rounded-xl">
            <BookOpen size={24} className="text-green" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Explore Courses</h1>
            <p className="text-grey-dark mt-1">
              Discover {courses.length} {courses.length === 1 ? 'course' : 'courses'} from expert instructors across Malawi
            </p>
          </div>
        </div>

        <PublicSponsorships placements={['FEATURED_LISTING', 'COURSE_LIST']} />

        <PublicCoursesClient courses={courses} />
      </div>
    </div>
  );
}
