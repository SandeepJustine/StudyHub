'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  AlertTriangle, Download, UserPlus,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface DashboardData {
  institution: {
    name: string;
    tier: string;
    studentCount: number;
    maxStudents: number;
    currentStudents: number;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    activeStudents: number;
    coursesAssigned: number;
    averageProgress: number;
    studentsAtRisk: number;
  };
  subscription: {
    status: string;
    tier: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
  courses: Array<{ id: string; title: string; subject: string; studentsCount: number }>;
}

export default function SchoolAdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/institutions/analytics');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setToast({ message: result.error || 'Failed to load dashboard', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Failed to load dashboard', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-6 bg-grey-light rounded animate-pulse mb-2"></div><div className="h-4 bg-grey-light rounded animate-pulse w-2/3"></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-grey-medium">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats = data.stats;
  const tier = data.institution.tier.replace('INSTITUTION_', '');
  const isBronze = data.institution.tier === 'INSTITUTION_BRONZE';

  return (
    <div className="space-y-6">
      {/* Subscription Alert */}
      {isBronze && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Bronze Tier - Upgrade for More Features</p>
              <p className="text-sm text-yellow-700">
                Unlock advanced analytics, custom branding, and parent portal with Silver or Gold tier
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm">Upgrade Now</Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Students</p>
                <p className="text-2xl font-bold text-navy">{stats.totalStudents}</p>
                <p className="text-xs text-grey-medium">{stats.activeStudents} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Teachers</p>
                <p className="text-2xl font-bold text-navy">{stats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Courses Assigned</p>
                <p className="text-2xl font-bold text-navy">{stats.coursesAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-navy">{stats.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button variant="primary" leftIcon={<UserPlus size={18} />}>
          Add Students
        </Button>
        <Button variant="outline" leftIcon={<Download size={18} />}>
          Export Report
        </Button>
      </div>

      {/* Students at Risk */}
      {stats.studentsAtRisk > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red" />
                Students at Risk ({stats.studentsAtRisk})
              </CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-grey-medium">
                {stats.studentsAtRisk} student{stats.studentsAtRisk > 1 ? 's are' : ' is'} showing low progress.
                Review their records and intervene.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Performance */}
      {data.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-navy">{course.title}</h4>
                    <p className="text-sm text-grey-medium">{course.subject}</p>
                  </div>
                  <Badge variant="info" size="sm">{course.studentsCount} students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Current Tier</p>
              <p className="text-xl font-bold text-navy">{tier}</p>
              <Badge variant="success" size="sm" className="mt-1">
                {data.subscription?.status || 'N/A'}
              </Badge>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Student Capacity</p>
              <p className="text-xl font-bold text-navy">{data.institution.maxStudents}</p>
              <p className="text-xs text-grey-medium">
                {data.institution.currentStudents}/{data.institution.maxStudents} used
              </p>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Next Renewal</p>
              <p className="text-xl font-bold text-navy">
                {data.subscription?.endDate ? formatDate(data.subscription.endDate) : 'N/A'}
              </p>
              <p className="text-xs text-green">
                {data.subscription?.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
