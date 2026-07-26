'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  UserPlus,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function SchoolAdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 156,
    activeStudents: 142,
    totalTeachers: 12,
    coursesAssigned: 24,
    averageProgress: 67,
    subscriptionTier: 'INSTITUTION_BRONZE',
    subscriptionStatus: 'active',
    renewalDate: '2026-08-15',
    studentsAtRisk: 8,
  });

  return (
    <div className="space-y-6">
      {/* Subscription Alert */}
      {stats.subscriptionTier === 'INSTITUTION_BRONZE' && (
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
              {[
                { name: 'John Phiri', grade: 'Form 4', progress: 25, lastActive: '3 days ago', reason: 'Low engagement' },
                { name: 'Mary Banda', grade: 'Form 3', progress: 30, lastActive: '1 week ago', reason: 'Incomplete assignments' },
                { name: 'Peter Kamanga', grade: 'Form 4', progress: 20, lastActive: '5 days ago', reason: 'Failed mock exam' },
              ].map((student, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-navy">{student.name}</h4>
                    <p className="text-sm text-grey-medium">
                      {student.grade} • {student.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-red">{student.progress}% progress</p>
                      <p className="text-xs text-grey-medium">Last active: {student.lastActive}</p>
                    </div>
                    <Button variant="outline" size="sm">Intervene</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance by Grade</CardTitle>
            <select className="px-3 py-1 border border-grey-light rounded text-sm">
              <option>All Grades</option>
              <option>Form 1</option>
              <option>Form 2</option>
              <option>Form 3</option>
              <option>Form 4</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { grade: 'Form 4', students: 45, avgScore: 72, passRate: 85, color: 'bg-blue-600' },
              { grade: 'Form 3', students: 38, avgScore: 68, passRate: 78, color: 'bg-green' },
              { grade: 'Form 2', students: 40, avgScore: 75, passRate: 90, color: 'bg-purple-600' },
              { grade: 'Form 1', students: 33, avgScore: 70, passRate: 82, color: 'bg-yellow-600' },
            ].map((grade, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="text-sm font-medium text-navy">{grade.grade}</p>
                  <p className="text-xs text-grey-medium">{grade.students} students</p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-grey-medium">Average Score</span>
                    <span className="font-medium text-navy">{grade.avgScore}%</span>
                  </div>
                  <div className="w-full bg-grey-light rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${grade.color}`}
                      style={{ width: `${grade.avgScore}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-medium text-green">{grade.passRate}%</p>
                  <p className="text-xs text-grey-medium">pass rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Current Tier</p>
              <p className="text-xl font-bold text-navy">
                {stats.subscriptionTier.replace('INSTITUTION_', '')}
              </p>
              <Badge variant="success" size="sm" className="mt-1">{stats.subscriptionStatus}</Badge>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Student Capacity</p>
              <p className="text-xl font-bold text-navy">200</p>
              <p className="text-xs text-grey-medium">{stats.totalStudents}/200 used</p>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Next Renewal</p>
              <p className="text-xl font-bold text-navy">{new Date(stats.renewalDate).toLocaleDateString()}</p>
              <p className="text-xs text-green">Auto-renewal enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}