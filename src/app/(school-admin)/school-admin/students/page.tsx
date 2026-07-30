'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { StudentForm } from '@/components/features/institution/student-form';
import { StudentDetailModal } from '@/components/features/institution/student-detail-modal';
import {
  Search, Filter, Download, UserPlus, Upload, Eye, Edit, Trash2,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  grade?: string;
  subjects: string[];
  enrollmentCount: number;
  averageProgress: number;
  lastActive?: Date | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchStudents = useCallback(async (page = 1, query = searchQuery, grade = selectedGrade) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(query && { query }),
        ...(grade && { grade }),
      });
      const res = await fetch(`/api/institutions/students?${params}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      setToast({ message: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGrade]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (formData: any) => {
    try {
      const res = await fetch('/api/institutions/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [formData] }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Student added successfully', type: 'success' });
        setShowAddStudent(false);
        fetchStudents();
      } else {
        setToast({ message: data.error || 'Failed to add student', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to add student', type: 'error' });
    }
  };

  const handleEditStudent = async (formData: any) => {
    if (!editingStudent) return;
    try {
      const res = await fetch(`/api/institutions/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Student updated successfully', type: 'success' });
        setEditingStudent(null);
        fetchStudents();
      } else {
        setToast({ message: data.error || 'Failed to update student', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to update student', type: 'error' });
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
    try {
      const res = await fetch(`/api/institutions/students/${student.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Student deleted successfully', type: 'success' });
        fetchStudents();
      } else {
        setToast({ message: data.error || 'Failed to delete student', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to delete student', type: 'error' });
    }
  };

  const handleViewStudent = async (student: Student) => {
    try {
      const res = await fetch(`/api/institutions/students/${student.id}`);
      const data = await res.json();
      if (data.success) {
        setViewingStudent(data.data);
      }
    } catch (error) {
      setToast({ message: 'Failed to load student details', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      accessor: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="text-sm font-medium text-navy">
              {student.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-navy">{student.name}</p>
            <p className="text-xs text-grey-medium">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      accessor: (student: Student) => (
        <Badge variant="neutral">{student.grade || 'N/A'}</Badge>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      accessor: (student: Student) => (
        <div className="flex gap-1 flex-wrap">
          {student.subjects.slice(0, 3).map((s: string) => (
            <Badge key={s} size="sm" variant="info">{s}</Badge>
          ))}
          {student.subjects.length > 3 && (
            <Badge size="sm" variant="neutral">+{student.subjects.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'avgScore',
      header: 'Avg Progress',
      accessor: (student: Student) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-grey-light rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                student.averageProgress >= 70 ? 'bg-green' :
                student.averageProgress >= 50 ? 'bg-yellow-500' : 'bg-red'
              }`}
              style={{ width: `${Math.min(student.averageProgress, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{Math.round(student.averageProgress)}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (student: Student) => (
        <Badge variant={student.lastActive ? 'success' : 'warning'}>
          {student.lastActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (student: Student) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewStudent(student)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditingStudent(student)}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteStudent(student)}>
            <Trash2 size={14} className="text-red" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Students</h1>
          <p className="text-grey-dark mt-1">Manage your institution's students</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Upload size={16} />} onClick={() => setShowBulkImport(true)}>
            Bulk Import
          </Button>
          <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={() => setShowAddStudent(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setTimeout(() => fetchStudents(1, e.target.value, selectedGrade), 500); }}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={selectedGrade}
            onChange={(e) => { setSelectedGrade(e.target.value); fetchStudents(1, searchQuery, e.target.value); }}
          >
            <option value="">All Grades</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="Form 4">Form 4</option>
          </select>
          <Button variant="outline" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="outline" leftIcon={<Download size={16} />}>Export</Button>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={students}
            columns={columns}
            isLoading={loading}
            emptyMessage="No students found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-grey-medium">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchStudents(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchStudents(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={showAddStudent || !!editingStudent}
        onClose={() => { setShowAddStudent(false); setEditingStudent(null); }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
          onCancel={() => { setShowAddStudent(false); setEditingStudent(null); }}
        />
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        title="Student Details"
        size="xl"
      >
        {viewingStudent && (
          <StudentDetailModal
            student={viewingStudent}
            onClose={() => setViewingStudent(null)}
            onEdit={() => { setViewingStudent(null); setEditingStudent(viewingStudent); }}
          />
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Bulk Import Students"
        size="md"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-grey-light rounded-xl p-12 text-center">
            <Upload size={48} className="mx-auto text-grey-medium mb-4" />
            <p className="text-grey-dark mb-2">Drag and drop your CSV file here</p>
            <p className="text-sm text-grey-medium mb-4">or</p>
            <Button variant="outline">Browse Files</Button>
          </div>
          <div className="bg-grey-light/50 rounded-lg p-4">
            <h4 className="font-semibold text-navy mb-2">CSV Format Requirements</h4>
            <p className="text-sm text-grey-dark mb-2">Your CSV file should include these columns:</p>
            <code className="text-xs bg-white px-3 py-2 rounded block">
              email, fullName, grade, examBoard, subjects (comma-separated)
            </code>
          </div>
          <div className="flex gap-3 justify-between">
            <Button variant="outline">Download Template</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>Cancel</Button>
              <Button variant="primary">Import Students</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
