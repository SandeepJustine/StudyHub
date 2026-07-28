import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, TrendingUp, Award, ChevronRight, Play, Star, GraduationCap, Target } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export default async function StudentDashboard() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true, grade: true, examBoard: true, subjects: true },
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

  let enrollments: any[] = [];
  let examAttempts: any[] = [];

  try {
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

  return (
    <div className="min-h-screen bg-grey-light p-6 space-y-6">
      {/* Greeting Card */}
      <Card className="bg-gradient-to-r from-white to-grey-light border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-navy">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy">
                  Hello, {session.user.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-grey-dark mt-1">Ready to continue learning today?</p>
                {student.grade && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="neutral" size="sm">{student.grade}</Badge>
                    {student.examBoard && <Badge variant="neutral" size="sm">{student.examBoard}</Badge>}
                  </div>
                )}
              </div>
            </div>
            <Link href="/student/courses">
              <Button variant="primary" rightIcon={<ChevronRight size={16} />}>
                Browse Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <BookOpen className="text-green" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Active Courses</p>
            </div>
            <p className="text-3xl font-bold text-navy">{activeEnrollments.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Award className="text-blue-600" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Completed</p>
            </div>
            <p className="text-3xl font-bold text-navy">{completedEnrollments.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-yellow-100 rounded-xl">
                <TrendingUp className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Avg Progress</p>
            </div>
            <p className="text-3xl font-bold text-navy">{averageProgress}%</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Clock className="text-red" size={20} />
              </div>
              <p className="text-sm font-medium text-grey-medium">Study Hours</p>
            </div>
            <p className="text-3xl font-bold text-navy">{studyHours}h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses - Takes 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <BookOpen size={18} className="text-green" />
              Active Courses
            </h2>
            <Link href="/student/courses">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {activeEnrollments.length > 0 ? (
              activeEnrollments.map((enrollment) => (
                <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-navy group-hover:text-red transition-colors">
                              {enrollment.course.title}
                            </h3>
                            {enrollment.certificateId && (
                              <Badge variant="success" size="sm">Certified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-grey-medium">
                            {enrollment.course.subject} • {enrollment.course.instructor?.user?.fullName || 'Unknown'}
                          </p>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-grey-medium">Progress</span>
                              <span className="font-semibold text-navy">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full bg-grey-light rounded-full h-2">
                              <div
                                className="bg-green rounded-full h-2 transition-all duration-500"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button variant="primary" size="sm" className="ml-4 flex-shrink-0">
                          <Play size={14} className="mr-1" /> Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <BookOpen size={40} className="mx-auto text-grey-medium mb-3" />
                  <h3 className="font-semibold text-navy mb-1">No active courses</h3>
                  <p className="text-sm text-grey-dark mb-4">Start learning by enrolling in a course</p>
                  <Link href="/student/courses">
                    <Button variant="primary">Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar - Recent Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Target size={18} className="text-red" />
              Recent Exams
            </h2>
            <Link href="/student/exams">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {examAttempts.length > 0 ? (
              examAttempts.slice(0, 5).map((attempt) => (
                <Card key={attempt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="font-medium text-navy text-sm truncate">
                          {attempt.quiz?.title || 'Unknown Quiz'}
                        </h4>
                        <p className="text-xs text-grey-medium mt-0.5">
                          {attempt.quiz?.module?.course?.title || 'Unknown'}
                        </p>
                        <p className="text-xs text-grey-medium mt-1">
                          {attempt.completedAt ? formatRelativeTime(attempt.completedAt) : 'In progress'}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className={`text-lg font-bold ${attempt.passed ? 'text-green' : 'text-red'}`}>
                          {attempt.score}%
                        </p>
                        <Badge variant={attempt.passed ? 'success' : 'error'} size="sm">
                          {attempt.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Target size={32} className="mx-auto text-grey-medium mb-2" />
                  <h4 className="font-semibold text-navy text-sm mb-1">No exams yet</h4>
                  <p className="text-xs text-grey-dark mb-3">Test your knowledge</p>
                  <Link href="/student/exams">
                    <Button variant="primary" size="sm">Take an Exam</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-navy text-sm mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/student/certificates" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <Award size={14} /> My Certificates
                </Link>
                <Link href="/student/lab" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <Star size={14} /> Virtual Lab
                </Link>
                <Link href="/student/community" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy transition-colors">
                  <GraduationCap size={14} /> Community
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}