'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { Edit, Mail, Phone, Calendar, BookOpen, BarChart3 } from 'lucide-react';

interface StudentDetailModalProps {
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    grade?: string | null;
    examBoard?: string | null;
    subjects: string[];
    lastActive?: Date | null;
    enrollments: Array<{
      id: string;
      courseId: string;
      courseTitle: string;
      subject: string;
      progress: number;
      completedAt?: Date | null;
    }>;
    recentExams: Array<{
      id: string;
      quizTitle: string;
      subject: string;
      score: number;
      passed: boolean;
      completedAt?: Date | null;
    }>;
  };
  onClose: () => void;
  onEdit: () => void;
}

export function StudentDetailModal({ student, onClose, onEdit }: StudentDetailModalProps) {
  const avgProgress = student.enrollments.length > 0
    ? student.enrollments.reduce((sum, e) => sum + e.progress, 0) / student.enrollments.length
    : 0;

  const avgExamScore = student.recentExams.length > 0
    ? student.recentExams.reduce((sum, e) => sum + e.score, 0) / student.recentExams.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-navy">
            {student.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-navy">{student.name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-grey-dark">
            <div className="flex items-center gap-1">
              <Mail size={14} />
              {student.email}
            </div>
            {student.phone && (
              <div className="flex items-center gap-1">
                <Phone size={14} />
                {student.phone}
              </div>
            )}
            {student.lastActive && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Last active: {formatRelativeTime(student.lastActive)}
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Edit size={14} />} onClick={onEdit}>
          Edit
        </Button>
      </div>

      {/* Academic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Grade</p>
            <p className="text-xl font-bold text-navy">{student.grade || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Exam Board</p>
            <p className="text-xl font-bold text-navy">{student.examBoard || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-grey-medium">Avg Progress</p>
            <p className="text-xl font-bold text-navy">{Math.round(avgProgress)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-3">Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {student.subjects.map(s => (
            <Badge key={s} variant="info" size="md">{s}</Badge>
          ))}
        </div>
      </div>

      {/* Enrollments */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
          <BookOpen size={18} />
          Enrollments ({student.enrollments.length})
        </h3>
        <div className="space-y-3">
          {student.enrollments.length === 0 ? (
            <p className="text-grey-medium">No course enrollments</p>
          ) : (
            student.enrollments.map(e => (
              <div key={e.id} className="p-4 border border-grey-light rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-navy">{e.courseTitle}</h4>
                    <p className="text-sm text-grey-medium">{e.subject}</p>
                  </div>
                  {e.completedAt && (
                    <Badge variant="success" size="sm">Completed</Badge>
                  )}
                </div>
                <div className="w-full bg-grey-light rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-navy"
                    style={{ width: `${e.progress}%` }}
                  />
                </div>
                <p className="text-xs text-grey-medium mt-1">{Math.round(e.progress)}% progress</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Exams */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
          <BarChart3 size={18} />
          Recent Exam Results ({student.recentExams.length})
        </h3>
        <div className="space-y-3">
          {student.recentExams.length === 0 ? (
            <p className="text-grey-medium">No exam attempts recorded</p>
          ) : (
            student.recentExams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between p-3 border border-grey-light rounded-lg">
                <div>
                  <h4 className="font-medium text-navy">{exam.quizTitle}</h4>
                  <p className="text-sm text-grey-medium">{exam.subject}</p>
                  {exam.completedAt && (
                    <p className="text-xs text-grey-medium">
                      {formatDate(exam.completedAt)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-navy">{Math.round(exam.score)}%</p>
                  <Badge variant={exam.passed ? 'success' : 'error'} size="sm">
                    {exam.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" leftIcon={<Edit size={14} />} onClick={onEdit}>
          Edit Student
        </Button>
      </div>
    </div>
  );
}
