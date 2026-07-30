import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Star, Video, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstructorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  let stats: any = null;
  let recentCourses: any[] = [];
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);
    
    const [dashboardStats, courses] = await Promise.all([
      instructorService.getDashboardStats(instructor.id),
      instructorService.getRecentCourses(instructor.id, 5),
    ]);

    stats = dashboardStats;
    recentCourses = courses;
  } catch (e: any) {
    console.error('Dashboard error:', e);
    error = e.message || 'Failed to load dashboard';
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">Error Loading Dashboard</h2>
        <p className="text-grey-dark mb-4">{error}</p>
        <Link href="/instructor/dashboard">
          <Button variant="primary">Retry</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Total Courses</p>
                <p className="text-xl font-bold text-navy">{stats?.totalCourses || 0}</p>
                <p className="text-xs text-grey-medium">{stats?.publishedCourses || 0} published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Active Students</p>
                <p className="text-xl font-bold text-navy">{stats?.activeStudents || 0}</p>
                <p className="text-xs text-grey-medium">{stats?.studentsCount || 0} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Total Earnings</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(stats?.totalEarnings || 0)}</p>
                <p className="text-xs text-yellow-600">{formatCurrency(stats?.pendingEarnings || 0)} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-grey-medium">Rating</p>
                <p className="text-xl font-bold text-navy">{stats?.rating ? stats.rating.toFixed(1) : 'N/A'}</p>
                <p className="text-xs text-grey-medium">{stats?.revenueShare ? `${Math.round(stats.revenueShare * 100)}% share` : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/instructor/courses/new">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Create New Course
          </Button>
        </Link>
        <Link href="/instructor/live-classes/new">
          <Button variant="outline" leftIcon={<Video size={16} />}>
            Schedule Live Class
          </Button>
        </Link>
        <Link href="/instructor/community/new">
          <Button variant="outline" leftIcon={<BookOpen size={16} />}>
            Post Announcement
          </Button>
        </Link>
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy">Recent Courses</h2>
          <Link href="/instructor/courses">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-2">
          {recentCourses.length > 0 ? (
            recentCourses.map((course: any) => (
              <Link key={course.id} href={`/instructor/courses/${course.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy text-sm">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-grey-medium">
                        <span className="flex items-center gap-1"><Users size={11} />{course._count?.enrollments || 0} students</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} />{course._count?.modules || 0} modules</span>
                        {course.rating > 0 && <span className="flex items-center gap-1"><Star size={11} className="text-yellow-500" />{course.rating.toFixed(1)}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <Badge variant={course.status === 'APPROVED' ? 'success' : course.status === 'PENDING_REVIEW' ? 'warning' : 'neutral'} size="sm">
                        {course.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <BookOpen size={32} className="mx-auto text-grey-medium mb-2" />
                <p className="text-sm text-grey-dark">No courses yet. Create your first course!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Earnings & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-navy text-sm mb-3">Earnings Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Total Earnings</span>
                <span className="font-semibold text-green">{formatCurrency(stats?.totalEarnings || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Pending Payout</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(stats?.pendingPayouts || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Pending Earnings</span>
                <span className="font-semibold text-blue-600">{formatCurrency(stats?.pendingEarnings || 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-grey-light pt-2">
                <span className="text-grey-medium">Revenue Share</span>
                <Badge variant="success" size="sm">{stats?.revenueShare ? `${Math.round(stats.revenueShare * 100)}%` : '70%'}</Badge>
              </div>
              <Link href="/instructor/earnings">
                <Button variant="primary" size="sm" fullWidth>View Earnings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-navy text-sm mb-3">Quick Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Upcoming Live Classes</span>
                <span className="font-semibold text-blue-600">{stats?.upcomingLiveClasses || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Verified Status</span>
                <Badge variant={stats?.isVerified ? 'success' : 'warning'} size="sm">
                  {stats?.isVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Rating</span>
                <span className="font-semibold text-yellow-600">
                  {stats?.rating ? `${stats.rating.toFixed(1)} / 5` : 'No ratings'}
                </span>
              </div>
              <Link href="/instructor/live-classes">
                <Button variant="outline" size="sm" fullWidth>
                  <Clock size={14} className="mr-1" /> Manage Live Classes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}