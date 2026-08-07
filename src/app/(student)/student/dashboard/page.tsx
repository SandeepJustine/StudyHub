import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, TrendingUp, Award, ChevronRight, Play, Star, GraduationCap, Target } from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { StudentDashboardClient } from './student-dashboard-client';

export default async function StudentDashboard() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true, grade: true, examBoard: true, subjects: true, institutionId: true },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Student Profile Not Found</h2>
          <p className="text-grey-dark">Please contact support to set up your student profile.</p>
        </div>
      </div>
    );
  }

  let institution: any = null;
  let institutionCourses: any[] = [];
  let enrolledCourseIds = new Set<string>();
  let enrollments: any[] = [];
  let examAttempts: any[] = [];
  let subscription: any = null;

  try {
    if (student.institutionId) {
      institution = await prisma.institution.findUnique({
        where: { id: student.institutionId },
        select: { id: true, name: true, tier: true },
      });

      const teachers = await prisma.schoolAdmin.findMany({
        where: { institutionId: student.institutionId, role: 'TEACHER' },
        select: { userId: true },
      });

      const instructorIds = teachers.length > 0
        ? await prisma.instructor.findMany({
            where: { userId: { in: teachers.map(t => t.userId) } },
            select: { id: true },
          })
        : [];

      const instructorIdList = instructorIds.map(i => i.id);

      institutionCourses = await prisma.course.findMany({
        where: {
          status: 'APPROVED',
          instructorId: { in: instructorIdList },
          NOT: {
            enrollments: {
              some: { studentId: student.id },
            },
          },
        },
        include: {
          instructor: { include: { user: { select: { fullName: true, avatar: true } } } },
          _count: { select: { modules: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
    }

    enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          include: {
            instructor: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    });

    enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

    examAttempts = await prisma.examAttempt.findMany({
      where: { studentId: student.id },
      include: {
        quiz: {
          include: {
            module: { include: { course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tier: true, status: true },
    });
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  const activeEnrollments = enrollments.filter(e => !e.completedAt);
  const completedEnrollments = enrollments.filter(e => e.completedAt);
  const averageProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments.length)
    : 0;
  const totalStudyMinutes = examAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const studyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;

  const isPremium = subscription?.tier === 'STUDENT_PREMIUM' || subscription?.tier === 'STUDENT_ANNUAL';

  return (
    <StudentDashboardClient
      student={student}
      session={session}
      institution={institution}
      institutionCourses={institutionCourses}
      enrollments={enrollments}
      examAttempts={examAttempts}
      activeEnrollments={activeEnrollments}
      completedEnrollments={completedEnrollments}
      averageProgress={averageProgress}
      studyHours={studyHours}
      subscription={subscription}
      isPremium={isPremium}
    />
  );
}
