'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Charts } from '@/components/features/analytics/charts';
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  AlertTriangle, Download, FileText, Award,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface AnalyticsData {
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
  analytics: {
    totalEnrollments: number;
    courseCompletion: number;
    averageScore: number;
    certificatesIssued: number;
    enrollmentTrend: string;
    completionTrend: string;
    scoreTrend: string;
    certificateTrend: string;
  };
  subscription: {
    status: string;
    tier: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
  courses: Array<{ id: string; title: string; subject: string; studentsCount: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/institutions/analytics');
        if (!res.ok) {
          const result = await res.json().catch(() => ({ error: 'Failed to load analytics' }));
          throw new Error(result.error || `Server error ${res.status}`);
        }
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setToast({ message: result.error || 'Failed to load analytics', type: 'error' });
        }
      } catch (error: any) {
        setToast({ message: error.message || 'Failed to load analytics data', type: 'error' });
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
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-grey-light rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-grey-light rounded animate-pulse w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-grey-light rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-grey-medium">Failed to load analytics data</p>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  const stats = data.stats;
  const analytics = data.analytics;
  const tier = data.institution.tier.replace('INSTITUTION_', '');

  // Build chart data from real course data
  const enrollmentChartData = data.courses.map((course, i) => ({
    label: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
    value: course.studentsCount,
    color: ['bg-navy', 'bg-red', 'bg-green', 'bg-blue-600', 'bg-purple-600', 'bg-yellow-600'][i % 6],
  }));

  // Subject distribution chart
  const subjectCounts: Record<string, number> = {};
  data.courses.forEach(c => {
    subjectCounts[c.subject] = (subjectCounts[c.subject] || 0) + c.studentsCount;
  });
  const subjectChartData = Object.entries(subjectCounts).map(([subject, count], i) => ({
    label: subject,
    value: count,
    color: ['bg-navy', 'bg-red', 'bg-green', 'bg-blue-600', 'bg-purple-600', 'bg-yellow-600'][i % 6],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics Dashboard</h1>
          <p className="text-grey-medium mt-1">
            {data.institution.name} • {tier} Tier
          </p>
        </div>
        <Button variant="outline" leftIcon={<Download size={18} />} onClick={() => {
          const csvContent = [
            ['Metric', 'Value'],
            ['Total Students', stats.totalStudents],
            ['Total Teachers', stats.totalTeachers],
            ['Active Students', stats.activeStudents],
            ['Courses Assigned', stats.coursesAssigned],
            ['Average Progress', `${stats.averageProgress}%`],
            ['Students at Risk', stats.studentsAtRisk],
            ['Total Enrollments', analytics.totalEnrollments],
            ['Course Completion', `${analytics.courseCompletion}%`],
            ['Average Score', `${analytics.averageScore}%`],
            ['Certificates Issued', analytics.certificatesIssued],
          ].map(e => e.join(',')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'analytics-report.csv';
          a.click();
          URL.revokeObjectURL(url);
        }}>
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Total Enrollments</p>
                <p className="text-2xl font-bold text-navy">{analytics.totalEnrollments}</p>
                <p className="text-xs text-grey-medium">{analytics.enrollmentTrend}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Course Completion</p>
                <p className="text-2xl font-bold text-navy">{analytics.courseCompletion}%</p>
                <p className="text-xs text-grey-medium">{analytics.completionTrend}</p>
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
                <p className="text-sm text-grey-medium">Avg. Score</p>
                <p className="text-2xl font-bold text-navy">{analytics.averageScore}%</p>
                <p className="text-xs text-grey-medium">{analytics.scoreTrend}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Certificates Issued</p>
                <p className="text-2xl font-bold text-navy">{analytics.certificatesIssued}</p>
                <p className="text-xs text-grey-medium">{analytics.certificateTrend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Charts
          data={enrollmentChartData}
          title="Enrollment by Course"
          type="bar"
          height={300}
          onExport={() => setToast({ message: 'Enrollment chart exported', type: 'success' })}
        />
        <Charts
          data={subjectChartData}
          title="Students by Subject"
          type="bar"
          height={300}
          onExport={() => setToast({ message: 'Subject chart exported', type: 'success' })}
        />
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
            <p className="text-sm text-grey-medium">
              {stats.studentsAtRisk} student{stats.studentsAtRisk > 1 ? 's are' : ' is'} showing low progress.
              Review their records and intervene.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Course Performance Table */}
      {data.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.courses.slice(0, 10).map((course) => (
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
