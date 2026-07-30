// components/features/analytics/AnalyticsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  AlertTriangle, Download, FileText, Award,
  RefreshCw, School,
} from 'lucide-react';

// Simple chart component (inline to avoid import issues)
function SimpleBarChart({ 
  data, 
  title, 
  height = 300 
}: { 
  data: Array<{ label: string; value: number; color?: string }>; 
  title: string; 
  height?: number;
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="flex items-end gap-2">
          {data.length === 0 ? (
            <div className="w-full flex items-center justify-center text-gray-400">
              No data available
            </div>
          ) : (
            data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">
                  {item.value}
                </span>
                <div
                  className={`w-full rounded-t ${item.color || 'bg-blue-500'}`}
                  style={{
                    height: `${(item.value / maxValue) * (height - 40)}px`,
                    minHeight: item.value > 0 ? '4px' : '0',
                  }}
                />
                <span className="text-xs text-gray-500 truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Toast component
function ToastMessage({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error'; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">✕</button>
      </div>
    </div>
  );
}

// Types
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
  courses: Array<{ 
    id: string; 
    title: string; 
    subject: string; 
    studentsCount: number; // Fixed field name
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/institutions/analytics');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      
      if (result.success && result.data) {
        // Validate the data structure
        const data = result.data;
        
        // Ensure courses array exists and has correct shape
        if (!data.courses) {
          data.courses = [];
        }
        
        // Map course fields to ensure studentsCount exists
        data.courses = data.courses.map((course: any) => ({
          id: course.id,
          title: course.title || 'Untitled',
          subject: course.subject || 'General',
          studentsCount: course.studentsCount || course.enrolledStudents || 0,
        }));
        
        setData(data);
        console.log('Analytics data loaded:', data); // Debug log
      } else {
        throw new Error(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setToast({ message: 'Failed to load analytics data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg w-12 h-12 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Analytics</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
        <Button onClick={fetchData} leftIcon={<RefreshCw size={18} />}>
          Retry
        </Button>
        {toast && (
          <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Analytics Data</h2>
        <p className="text-gray-600 mb-6">There is no analytics data available yet.</p>
        <Button onClick={fetchData} leftIcon={<RefreshCw size={18} />}>
          Refresh
        </Button>
      </div>
    );
  }

  // Destructure with safe defaults
  const stats = data.stats || {};
  const analytics = data.analytics || {};
  const tier = (data.institution?.tier || 'BRONZE').replace('INSTITUTION_', '');
  const courses = data.courses || [];

  // Build chart data
  const enrollmentChartData = courses.slice(0, 10).map((course, i) => ({
    label: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
    value: course.studentsCount || 0,
    color: [
      'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ][i % 10],
  }));

  // Subject distribution
  const subjectCounts: Record<string, number> = {};
  courses.forEach(c => {
    const subject = c.subject || 'General';
    subjectCounts[subject] = (subjectCounts[subject] || 0) + (c.studentsCount || 0);
  });
  
  const subjectChartData = Object.entries(subjectCounts).map(([subject, count], i) => ({
    label: subject,
    value: count,
    color: [
      'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ][i % 8],
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {data.institution?.name || 'Institution'} • {tier} Tier
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            leftIcon={<Download size={18} />} 
            onClick={() => {
              try {
                const csvContent = [
                  ['Metric', 'Value'],
                  ['Total Students', stats.totalStudents || 0],
                  ['Total Teachers', stats.totalTeachers || 0],
                  ['Active Students', stats.activeStudents || 0],
                  ['Courses Assigned', stats.coursesAssigned || 0],
                  ['Average Progress', `${stats.averageProgress || 0}%`],
                  ['Students at Risk', stats.studentsAtRisk || 0],
                  ['Total Enrollments', analytics.totalEnrollments || 0],
                  ['Course Completion', `${analytics.courseCompletion || 0}%`],
                  ['Average Score', `${analytics.averageScore || 0}%`],
                  ['Certificates Issued', analytics.certificatesIssued || 0],
                ].map(e => e.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analytics-report.csv';
                a.click();
                URL.revokeObjectURL(url);
                
                setToast({ message: 'Report exported successfully', type: 'success' });
              } catch (err) {
                setToast({ message: 'Failed to export report', type: 'error' });
              }
            }}
          >
            Export Report
          </Button>
          <Button 
            variant="ghost" 
            onClick={fetchData}
            leftIcon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>
        </div>
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
                <p className="text-sm text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalEnrollments || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.enrollmentTrend || 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Course Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.courseCompletion || 0}%
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.completionTrend || 'No data'}
                </p>
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
                <p className="text-sm text-gray-500">Avg. Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.averageScore || 0}%
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.scoreTrend || 'No data'}
                </p>
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
                <p className="text-sm text-gray-500">Certificates Issued</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.certificatesIssued || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.certificateTrend || 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatBadge label="Students" value={stats.totalStudents || 0} icon={<GraduationCap size={16} />} />
        <StatBadge label="Teachers" value={stats.totalTeachers || 0} icon={<School size={16} />} />
        <StatBadge label="Active" value={stats.activeStudents || 0} icon={<Users size={16} />} />
        <StatBadge label="Courses" value={stats.coursesAssigned || 0} icon={<BookOpen size={16} />} />
        <StatBadge label="Avg Progress" value={`${stats.averageProgress || 0}%`} icon={<TrendingUp size={16} />} />
        <StatBadge 
          label="At Risk" 
          value={stats.studentsAtRisk || 0} 
          icon={<AlertTriangle size={16} />}
          alert={stats.studentsAtRisk > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={enrollmentChartData}
          title="Enrollment by Course"
          height={300}
        />
        <SimpleBarChart
          data={subjectChartData}
          title="Students by Subject"
          height={300}
        />
      </div>

      {/* Students at Risk Alert */}
      {(stats.studentsAtRisk || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">
                  {stats.studentsAtRisk} Student{stats.studentsAtRisk > 1 ? 's' : ''} at Risk
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {stats.studentsAtRisk} student{stats.studentsAtRisk > 1 ? 's are' : ' is'} 
                  showing progress below 50%. Consider reaching out to provide additional support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Performance Table */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.slice(0, 10).map((course) => (
                <div 
                  key={course.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-500">{course.subject}</p>
                  </div>
                  <Badge variant="info" size="sm">
                    {course.studentsCount || 0} students
                  </Badge>
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Current Tier</p>
              <p className="text-xl font-bold text-gray-900">{tier}</p>
              <Badge variant="success" size="sm" className="mt-1">
                {data.subscription?.status || 'N/A'}
              </Badge>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Student Capacity</p>
              <p className="text-xl font-bold text-gray-900">
                {data.institution?.maxStudents || 0}
              </p>
              <p className="text-xs text-gray-500">
                {data.institution?.currentStudents || 0}/{data.institution?.maxStudents || 0} used
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Next Renewal</p>
              <p className="text-xl font-bold text-gray-900">
                {data.subscription?.endDate 
                  ? new Date(data.subscription.endDate).toLocaleDateString() 
                  : 'N/A'}
              </p>
              <p className={`text-xs ${data.subscription?.autoRenew ? 'text-green-600' : 'text-red-600'}`}>
                {data.subscription?.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast notification */}
      {toast && (
        <ToastMessage 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

// Small stat badge component
function StatBadge({ 
  label, 
  value, 
  icon, 
  alert 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${
      alert ? 'bg-red-50 border border-red-200' : 'bg-white border'
    }`}>
      <span className={`${alert ? 'text-red-500' : 'text-gray-400'}`}>{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-semibold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}