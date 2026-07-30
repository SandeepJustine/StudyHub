'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { TeacherForm } from '@/components/features/institution/teacher-form';
import {
  Search, Filter, Download, UserPlus, Phone,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastActive?: Date | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTeachers = useCallback(async (page = 1, query = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(query && { query }),
      });
      const res = await fetch(`/api/institutions/teachers?${params}`);
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data);
        setPagination(data.pagination);
      } else {
        setToast({ message: data.error || 'Failed to load teachers', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to load teachers', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAddTeacher = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/institutions/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Teacher added successfully', type: 'success' });
        setShowAddTeacher(false);
        fetchTeachers();
      } else {
        setToast({ message: data.error || 'Failed to add teacher', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to add teacher', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditTeacher = async (formData: any) => {
    if (!editingTeacher) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/institutions/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Teacher updated successfully', type: 'success' });
        setEditingTeacher(null);
        fetchTeachers();
      } else {
        setToast({ message: data.error || 'Failed to update teacher', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to update teacher', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}?`)) return;
    try {
      const res = await fetch(`/api/institutions/teachers/${teacher.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Teacher deleted successfully', type: 'success' });
        fetchTeachers();
      } else {
        setToast({ message: data.error || 'Failed to delete teacher', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Failed to delete teacher', type: 'error' });
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Teacher Name',
      accessor: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="text-sm font-medium text-navy">
              {teacher.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-navy">{teacher.name}</p>
            <p className="text-xs text-grey-medium">{teacher.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (teacher: Teacher) => (
        <div className="flex items-center gap-1 text-sm">
          <Phone size={14} className="text-grey-medium" />
          {teacher.phone || 'N/A'}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (teacher: Teacher) => (
        <Badge variant={teacher.role === 'HEAD' ? 'info' : 'success'}>
          {teacher.role === 'HEAD' ? 'Head' : 'Teacher'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (teacher: Teacher) => (
        <Badge variant={teacher.status === 'active' ? 'success' : 'error'}>
          {teacher.status === 'active' ? 'Active' : 'Locked'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (teacher: Teacher) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditingTeacher(teacher)}>
            <span className="text-navy">Edit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteTeacher(teacher)}>
            <span className="text-red">Delete</span>
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
          <h1 className="text-2xl font-bold text-navy">Teachers</h1>
          <p className="text-grey-dark mt-1">Manage your institution's teaching staff</p>
        </div>
        <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={() => setShowAddTeacher(true)}>
          Add Teacher
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setTimeout(() => fetchTeachers(1, e.target.value), 500); }}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <Button variant="outline" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="outline" leftIcon={<Download size={16} />}>Export</Button>
        </div>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={teachers}
            columns={columns}
            isLoading={loading}
            emptyMessage="No teachers found"
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
              onClick={() => fetchTeachers(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchTeachers(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      <Modal
        isOpen={showAddTeacher || !!editingTeacher}
        onClose={() => { setShowAddTeacher(false); setEditingTeacher(null); }}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="md"
      >
        <TeacherForm
          teacher={editingTeacher}
          onSubmit={editingTeacher ? handleEditTeacher : handleAddTeacher}
          onCancel={() => { setShowAddTeacher(false); setEditingTeacher(null); }}
          loading={saving}
        />
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
