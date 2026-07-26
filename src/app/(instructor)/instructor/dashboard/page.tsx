import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default async function InstructorDashboardPage() {
  const session = await getServerSession(authOptions);

  // Mock data - in production, fetch from API
  const stats = {
    totalCourses: 12,
    activeStudents: 450,
    totalEarnings: 1250000,
    monthlyEarnings: 250000,
    averageRating: 4.7,
    pendingPayouts: 180000,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Courses</p>
                <p className="text-2xl font-bold text-navy">{stats.totalCourses}</p>
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
                <p className="text-sm text-grey-medium">Active Students</p>
                <p className="text-2xl font-bold text-navy">{stats.activeStudents}</p>
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
                <p className="text-sm text-grey-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-navy">{formatCurrency(stats.totalEarnings)}</p>
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
                <p className="text-2xl font-bold text-navy">{stats.averageRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Create New Course
        </Button>
        <Button variant="outline">
          Schedule Live Class
        </Button>
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Courses</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: 'MSCE Mathematics', students: 120, revenue: 450000, status: 'Published' },
              { title: 'Physics Fundamentals', students: 85, revenue: 320000, status: 'Published' },
              { title: 'English Grammar', students: 60, revenue: 180000, status: 'Draft' },
            ].map((course, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-grey-light/50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-navy">{course.title}</h3>
                  <p className="text-sm text-grey-medium">{course.students} students</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green">{formatCurrency(course.revenue)}</p>
                  <Badge variant={course.status === 'Published' ? 'success' : 'warning'} size="sm">
                    {course.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 mb-1">This Month</p>
              <p className="text-2xl font-bold text-green">{formatCurrency(stats.monthlyEarnings)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-1">Pending Payout</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pendingPayouts)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800 mb-1">Revenue Share</p>
              <p className="text-2xl font-bold text-purple-600">70%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}