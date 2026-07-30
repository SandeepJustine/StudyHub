import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, Star, Calendar } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function InstructorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const range = {
    ...(params.from ? { from: new Date(params.from) } : {}),
    ...(params.to ? { to: new Date(params.to) } : {}),
  };

  let data: any = null;
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);
    data = await instructorService.getAnalytics(instructor.id, range);
  } catch (e: any) {
    error = e.message || 'Failed to load analytics';
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">Error</h2>
        <p className="text-grey-dark">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">No Data</h2>
        <p className="text-grey-dark">No analytics data available.</p>
      </div>
    );
  }

  const { overview, enrollmentByDay, revenueTrend, revenueByCourse, ratingDistribution, topCourses } = data;

  // Calculate date range display
  const fromDate = data.range.from;
  const toDate = data.range.to;
  const rangeDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="text-sm text-grey-medium">
            Showing data from {fromDate.toLocaleDateString()} to {toDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info" size="sm">{rangeDays} days</Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Courses</p>
                <p className="text-2xl font-bold text-navy">{overview.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Enrollments</p>
                <p className="text-2xl font-bold text-navy">{overview.totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(overview.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Avg Rating</p>
                <p className="text-2xl font-bold text-navy">
                  {overview.averageRating > 0 ? `${overview.averageRating.toFixed(1)}/5` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed analytics */}
      <Tabs value="enrollment" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="enrollment">Enrollment Trend</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="courses">Top Courses</TabsTrigger>
          <TabsTrigger value="ratings">Rating Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trend</CardTitle>
              <CardDescription>New enrollments per day</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentByDay && enrollmentByDay.length > 0 ? (
                <div className="space-y-3">
                  {enrollmentByDay.map((day: any) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-grey-medium w-20">{day.date}</span>
                      <div className="flex-1 bg-grey-light rounded-lg h-6 relative">
                        <div
                          className="bg-navy h-full rounded-lg"
                          style={{ width: `${Math.min((day.count / Math.max(...enrollmentByDay.map((d: any) => d.count), 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-grey-dark w-8 text-right">{day.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-grey-medium">No enrollment data for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Your earnings per day</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueTrend && revenueTrend.length > 0 ? (
                <div className="space-y-3">
                  {revenueTrend.map((day: any) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-grey-medium w-20">{day.date}</span>
                      <div className="flex-1 bg-grey-light rounded-lg h-6 relative">
                        <div
                          className="bg-green h-full rounded-lg"
                          style={{ width: `${Math.min((day.amount / Math.max(...revenueTrend.map((d: any) => d.amount), 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-grey-dark w-24 text-right">{formatCurrency(day.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-grey-medium">No revenue data for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Top Courses by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topCourses && topCourses.length > 0 ? (
                <div className="space-y-3">
                  {topCourses.map((course: any, i: number) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-navy">#{i + 1}</span>
                        <div>
                          <h4 className="font-semibold text-navy">{course.title}</h4>
                          <p className="text-xs text-grey-medium">{course.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green">{formatCurrency(course.revenue)}</p>
                        <p className="text-xs text-grey-medium">{course.students} students</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-grey-medium">No course data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingDistribution && ratingDistribution.length > 0 ? (
                <div className="space-y-3">
                  {ratingDistribution
                    .slice()
                    .reverse()
                    .map((r: any) => (
                      <div key={r.stars} className="flex items-center gap-3">
                        <span className="text-xs text-grey-medium w-12">{r.stars} ★</span>
                        <div className="flex-1 bg-grey-light rounded-lg h-6 relative">
                          <div
                            className="bg-yellow-400 h-full rounded-lg"
                            style={{ width: `${(r.count / Math.max(...ratingDistribution.map((d: any) => d.count), 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-grey-dark w-8 text-right">{r.count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-grey-medium">No rating data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
