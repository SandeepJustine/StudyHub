import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { CourseFilterClient } from './courses-client';
import { BookOpen, Star, Users, Clock, ArrowRight, Filter } from 'lucide-react';

export default async function StudentCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true, grade: true, examBoard: true, subjects: true, institutionId: true },
  });

  if (!student) {
    redirect('/student/dashboard');
  }

  let institution: any = null;
  let institutionId: string | null = null;
  let institutionName: string | null = null;

  if (student.institutionId) {
    institution = await prisma.institution.findUnique({
      where: { id: student.institutionId },
      select: { id: true, name: true, tier: true },
    });
    institutionId = student.institutionId;
    institutionName = institution?.name || null;
  }

  // Fetch all approved courses
  const courses = await prisma.course.findMany({
    where: { status: 'APPROVED' },
      include: {
        instructor: {
          include: {
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
    take: 50,
  });

  // Determine which instructors are linked to institutions
  const instructorUserIds = courses
    .map(c => c.instructor?.userId)
    .filter((id): id is string => !!id);

  const schoolAdminUsers = instructorUserIds.length > 0
    ? await prisma.schoolAdmin.findMany({
        where: { userId: { in: instructorUserIds } },
        select: { userId: true },
      })
    : [];

  const institutionInstructorIds = new Set(schoolAdminUsers.map(sa => sa.userId));

  // Enrich courses with institution flag
  const enrichedCourses = courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    subject: course.subject,
    examBoard: course.examBoard,
    grade: course.grade,
    price: course.price,
    duration: course.duration,
    rating: course.rating,
    thumbnail: course.thumbnail,
    language: course.language,
    tags: course.tags,
    publishedAt: course.publishedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    instructor: course.instructor,
    _count: course._count,
    isInstitutionCourse: course.instructor ? institutionInstructorIds.has(course.instructor.userId) : false,
  }));

  const initialFilter: 'all' | 'institution' | 'independent' = institutionId ? 'all' : 'all';

  return (
    <div className="p-6 space-y-6">
      <CourseFilterClient
        courses={enrichedCourses}
        institutionId={institutionId}
        institutionName={institutionName}
        initialFilter={initialFilter}
      />
    </div>
  );
}
