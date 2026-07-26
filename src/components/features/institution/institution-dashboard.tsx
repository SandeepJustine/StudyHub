'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InstitutionStats } from './institution-stats';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CreditCard,
  Download,
  UserPlus,
  Upload,
  Search,
  Filter,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface StudentData {
  id: string;
  name: string;
  email: string;
  grade: string;
  subjects: string[];
  averageScore: number;
  progress: number;
  status: 'active' | 'at_risk' | 'inactive';
  lastActive: Date;
}

interface InstitutionDashboardProps {
  institution: {
    id: string;
    name: string;
    tier: string;
    stats: {
      totalStudents: number;
      activeStudents: number;
      totalTeachers: number;
      coursesAssigned: number;
      averageProgress: number;
      studentsAtRisk: number;
      capacityUsed: number;
      maxCapacity: number;
      subscriptionTier: string;
      renewalDate: Date;
    };
  };
  students: StudentData[];
  onViewStudent: (studentId: string) => void;
  onAddStudent: () => void;
  onBulkImport: () => void;
  onExportReport: () => void;
}

export function InstitutionDashboard({
  institution,
  students,
  onViewStudent,
  onAddStudent,
  onBulkImport,
  onExportReport,
}: InstitutionDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = !gradeFilter || s.grade === gradeFilter;
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const grades = [...new Set(students.map(s => s.grade))].filter(Boolean).sort();

  return (
    <div className="space-y-6">
      {/* Subscription Alert */}
      {institution.tier === 'INSTITUTION_BRONZE' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Bronze Tier</p>
              <p className="text-sm text-yellow-700">Upgrade for more features and students</p>
            </div>
          </div>
          <Button variant="primary" size="sm">Upgrade Now</Button>
        </div>
      )}

      {/* Stats */}
      <InstitutionStats stats={institution.stats} />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={onAddStudent}>
          Add Student
        </Button>
        <Button variant="outline" leftIcon={<Upload size={16} />} onClick={onBulkImport}>
          Bulk Import
        </Button>
        <Button variant="outline" leftIcon={<Download size={16} />} onClick={onExportReport}>
          Export Report
        </Button>
      </div>

      {/* Students at Risk */}
      {institution.stats.studentsAtRisk > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red" />
              Students at Risk ({institution.stats.studentsAtRisk})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students
                .filter(s => s.status === 'at_risk')
                .slice(0, 3)
                .map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-navy">{student.name}</h4>
                      <p className="text-sm text-grey-medium">
                        {student.grade} • Progress: {student.progress}% • Avg Score: {student.averageScore}%
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onViewStudent(student.id)}>
                      View
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students ({students.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-grey-medium" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-grey-light rounded-lg text-sm w-48"
                />
              </div>
              <select
                className="px-3 py-1.5 border border-grey-light rounded-lg text-sm"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="">All Grades</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select
                className="px-3 py-1.5 border border-grey-light rounded-lg text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-grey-light">
                  <th className="text-left px-6 py-3 text-xs font-medium text-grey-medium">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-grey-medium">Grade</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-grey-medium">Subjects</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-grey-medium">Progress</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-grey-medium">Avg Score</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-grey-medium">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-grey-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-grey-light hover:bg-grey-light/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-navy">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy">{student.name}</p>
                          <p className="text-xs text-grey-medium">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="neutral" size="sm">{student.grade}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.subjects.slice(0, 2).map(s => (
                          <Badge key={s} variant="info" size="sm">{s}</Badge>
                        ))}
                        {student.subjects.length > 2 && (
                          <Badge variant="neutral" size="sm">+{student.subjects.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={student.progress} size="sm" className="w-20" />
                        <span className="text-xs font-medium">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        student.averageScore >= 70 ? 'text-green' :
                        student.averageScore >= 50 ? 'text-yellow-600' : 'text-red'
                      }`}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant={
                        student.status === 'active' ? 'success' :
                        student.status === 'at_risk' ? 'error' : 'neutral'
                      } size="sm">
                        {student.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onViewStudent(student.id)}>
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-grey-medium mb-2" />
              <p className="text-grey-dark">No students found</p>
            </div>
          )}
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
                {institution.stats.subscriptionTier.replace('INSTITUTION_', '')}
              </p>
              <Badge variant="success" size="sm" className="mt-1">Active</Badge>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Student Capacity</p>
              <p className="text-xl font-bold text-navy">{institution.stats.maxStudents}</p>
              <p className="text-xs text-grey-medium">
                {institution.stats.capacityUsed}/{institution.stats.maxStudents} used
              </p>
            </div>
            <div className="p-4 bg-navy/5 rounded-lg">
              <p className="text-sm text-grey-medium mb-1">Next Renewal</p>
              <p className="text-xl font-bold text-navy">
                {formatDate(institution.stats.renewalDate)}
              </p>
              <p className="text-xs text-green">Auto-renewal enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}