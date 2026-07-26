import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { enrollmentService } from '@/lib/courses/enrollment-service';
import { examEngine } from '@/lib/exams/exam-engine';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import { PaginatedStudentEnrollments } from '@/types/enrollment';
import { PaginatedStudentExamHistory } from '@/types/exams';

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'STUDENT') {
    redirect(`/${session.user.role.toLowerCase()}/dashboard`);
  }

  const studentId = session.user.studentId;
  
  if (!studentId) {
    return <div>Student profile not found</div>;
  }

  // Fetch student data
  const [enrollments, examHistory]: [PaginatedStudentEnrollments, PaginatedStudentExamHistory] = await Promise.all([
    enrollmentService.getStudentEnrollments(studentId, { limit: 5 }) as Promise<PaginatedStudentEnrollments>,
    examEngine.getStudentExamHistory(studentId, { limit: 5 }) as Promise<PaginatedStudentExamHistory>,
  ]);

  const activeEnrollments = enrollments.enrollments.filter(e => !e.completedAt);
  const completedEnrollments = enrollments.enrollments.filter(e => e.completedAt);

  return (
    <div className="min-h-screen bg-grey-light">
      {/* Welcome Header */}
      <div className="bg-navy text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold font-poppins">
            Hello, {session.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-grey-light mt-2 text-lg">
            Continue your learning journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Active Courses</p>
                <p className="text-2xl font-bold text-navy">{activeEnrollments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Completed</p>
                <p className="text-2xl font-bold text-navy">{completedEnrollments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-navy">
                  {Math.round(
                    activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / 
                    (activeEnrollments.length || 1)
                  )}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Clock className="text-red" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Study Hours</p>
                <p className="text-2xl font-bold text-navy">12.5</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">Active Courses</h2>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
              View All
            </Button>
          </div>

          <div className="grid gap-4">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id} hover padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-grey-medium mt-1">
                      {enrollment.course.subject} • {enrollment.course.instructor.user.fullName}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-grey-dark">Progress</span>
                        <span className="font-medium text-navy">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-grey-light rounded-full h-2">
                        <div
                          className="bg-green rounded-full h-2 transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="ml-4">
                    Continue
                  </Button>
                </div>
              </Card>
            ))}

            {activeEnrollments.length === 0 && (
              <Card padding="lg" className="text-center">
                <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
                <h3 className="text-lg font-semibold text-navy mb-2">No active courses</h3>
                <p className="text-grey-dark mb-4">Start learning by enrolling in a course</p>
                <Button variant="primary">Browse Courses</Button>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Exams */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">Recent Exams</h2>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
              View All
            </Button>
          </div>

          <div className="grid gap-4">
            {examHistory.attempts.slice(0, 3).map((attempt) => (
              <Card key={attempt.id} padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-navy">
                      {attempt.quiz.title}
                    </h3>
                    <p className="text-sm text-grey-medium">
                      {attempt.quiz.module.course.title} • {formatRelativeTime(attempt.completedAt!)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${attempt.passed ? 'text-green' : 'text-red'}`}>
                      {attempt.score}%
                    </p>
                    <Badge variant={attempt.passed ? 'success' : 'error'} size="sm">
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}