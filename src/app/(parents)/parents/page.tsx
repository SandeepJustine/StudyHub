'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  Award,
  AlertTriangle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Child {
  id: string;
  name: string;
  grade: string;
  institution: string;
  relationship: string;
}

interface RecentScore {
  subject: string;
  score: number;
  date: string;
}

interface Certificate {
  title: string;
  type: string;
  issuedAt: string;
  verificationId: string;
}

interface DashboardData {
  studentId: string;
  studentName: string;
  grade: string;
  institution: string;
  attendance: number;
  averageScore: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  upcomingExams: number;
  recentScores: RecentScore[];
  certificates: Certificate[];
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const childrenRes = await fetch('/api/parent/children');
        if (childrenRes.ok) {
          const childrenData = await childrenRes.json();
          if (childrenData.success && childrenData.data.length > 0) {
            const childrenList = childrenData.data.map((c: any) => ({
              id: c.studentId,
              name: c.studentName,
              grade: c.grade,
              institution: c.institution || 'N/A',
              relationship: c.relationship,
            }));
            setChildren(childrenList);
            setSelectedChildId(childrenList[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!selectedChildId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/parent/dashboard?studentId=${selectedChildId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDashboardData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedChildId]);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey-dark">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Parent Dashboard</h1>
          <p className="text-grey-dark mt-1">Monitor your children's academic progress</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No Children Linked</h3>
            <p className="text-sm text-grey-dark mb-4">
              You haven't linked any students to your account yet.
            </p>
            <Button variant="primary">Link a Student</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              selectedChildId === child.id
                ? 'bg-navy text-white'
                : 'bg-white text-navy hover:bg-navy/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              selectedChildId === child.id ? 'bg-white/20' : 'bg-navy/10'
            }`}>
              {child.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-left">
              <p className="font-semibold">{child.name}</p>
              <p className="text-xs opacity-75">{child.grade} • {child.institution}</p>
            </div>
          </button>
        ))}
      </div>

      {dashboardData && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="text-green" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-grey-medium">Attendance</p>
                    <p className="text-xl font-bold text-navy">{dashboardData.attendance}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-grey-medium">Avg Score</p>
                    <p className="text-xl font-bold text-navy">{dashboardData.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-grey-medium">Courses</p>
                    <p className="text-xl font-bold text-navy">
                      {dashboardData.coursesCompleted}/{dashboardData.coursesEnrolled}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <GraduationCap className="text-yellow-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-grey-medium">Upcoming Exams</p>
                    <p className="text-xl font-bold text-navy">{dashboardData.upcomingExams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Scores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Exam Scores</CardTitle>
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dashboardData.recentScores.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentScores.map((score, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-grey-light/50 rounded-lg">
                        <div>
                          <p className="font-medium text-navy">{score.subject}</p>
                          <p className="text-xs text-grey-medium">{formatRelativeTime(score.date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 bg-grey-light rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                score.score >= 70 ? 'bg-green' : score.score >= 50 ? 'bg-yellow-500' : 'bg-red'
                              }`}
                              style={{ width: `${score.score}%` }}
                            />
                          </div>
                          <span className={`font-bold ${
                            score.score >= 70 ? 'text-green' : score.score >= 50 ? 'text-yellow-600' : 'text-red'
                          }`}>
                            {score.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-grey-medium text-center py-4">No exam scores yet</p>
                )}
              </CardContent>
            </Card>

            {/* Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award size={20} className="text-yellow-600" />
                  Certificates Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.certificates.map((cert, i) => (
                      <div key={i} className="p-3 border-2 border-grey-light rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-navy">{cert.title}</p>
                            <p className="text-xs text-grey-medium">
                              Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={cert.type === 'VERIFIED' ? 'success' : 'neutral'} size="sm">
                            {cert.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-grey-medium text-center py-4">No certificates earned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
