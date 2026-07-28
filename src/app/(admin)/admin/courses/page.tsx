'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Plus,
  RefreshCw,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; label: string }>({ action: '', label: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter, pagination.page]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/courses?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();

      if (data.success) {
        setCourses(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message);

      // Mock data fallback
      setCourses([
        { id: '1', title: 'MSCE Mathematics', subject: 'Mathematics', examBoard: 'MSCE', price: 15000, status: 'APPROVED', studentsCount: 120, rating: 4.5, instructor: { user: { fullName: 'Mr. John Doe', email: 'john@email.com' } }, stats: { enrollments: 120, reviews: 25, modules: 12 }, createdAt: '2025-01-15', publishedAt: '2025-02-01' },
        { id: '2', title: 'JCE English Literature', subject: 'English', examBoard: 'JCE', price: 12000, status: 'PENDING_REVIEW', studentsCount: 50, rating: 0, instructor: { user: { fullName: 'Ms. Jane Smith', email: 'jane@email.com' } }, stats: { enrollments: 0, reviews: 0, modules: 8 }, createdAt: '2025-03-10' },
        { id: '3', title: 'ICAM Financial Accounting', subject: 'Accounting', examBoard: 'ICAM', price: 30000, status: 'APPROVED', studentsCount: 80, rating: 4.8, instructor: { user: { fullName: 'Dr. Alex Banda', email: 'alex@email.com' } }, stats: { enrollments: 80, reviews: 15, modules: 20 }, createdAt: '2025-02-20' },
        { id: '4', title: 'TEVETA Electrical', subject: 'Technical', examBoard: 'TEVETA', price: 25000, status: 'REJECTED', studentsCount: 0, rating: 0, instructor: { user: { fullName: 'Eng. Mary Phiri', email: 'mary@email.com' } }, stats: { enrollments: 0, reviews: 0, modules: 10 }, createdAt: '2025-04-01' },
      ]);
      setPagination({ page: 1, limit: 10, total: 4, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (action: string, courseId: string) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, action }),
      });

      if (!response.ok) throw new Error('Action failed');

      setToast({ message: `Course ${action}ed successfully`, type: 'success' });
      setShowConfirmModal(false);
      setShowActionMenu(null);
      fetchCourses();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING_REVIEW': return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED': return <Badge variant="error">Rejected</Badge>;
      case 'DRAFT': return <Badge variant="neutral">Draft</Badge>;
      case 'ARCHIVED': return <Badge variant="neutral">Archived</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Course',
      accessor: (course: any) => (
        <div>
          <p className="font-medium text-navy">{course.title}</p>
          <p className="text-xs text-grey-medium">{course.subject} • {course.examBoard}</p>
        </div>
      ),
    },
    {
      key: 'instructor',
      header: 'Instructor',
      accessor: (course: any) => (
        <div className="text-sm">
          <p>{course.instructor?.user?.fullName || 'Unknown'}</p>
          <p className="text-xs text-grey-medium">{course.instructor?.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (course: any) => (
        <span className="font-semibold text-navy">{formatCurrency(course.price)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (course: any) => getStatusBadge(course.status),
    },
    {
      key: 'stats',
      header: 'Stats',
      accessor: (course: any) => (
        <div className="text-sm">
          <p>{course.studentsCount || course.stats?.enrollments || 0} students</p>
          {course.rating > 0 && <p className="text-xs text-yellow-600">★ {course.rating.toFixed(1)}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (course: any) => (
        <div className="text-sm">
          <p>{formatDate(course.createdAt)}</p>
          {course.publishedAt && <p className="text-xs text-green">Published: {formatDate(course.publishedAt)}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (course: any) => (
        <div className="flex gap-1 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedCourse(course); setShowDetailModal(true); }}
          >
            <Eye size={14} className="mr-1" /> View
          </Button>
          {course.status === 'PENDING_REVIEW' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  setSelectedCourse(course);
                  setConfirmAction({ action: 'approve', label: 'Approve Course' });
                  setShowConfirmModal(true);
                }}
              >
                <Check size={14} className="mr-1" /> Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSelectedCourse(course);
                  setConfirmAction({ action: 'reject', label: 'Reject Course' });
                  setShowConfirmModal(true);
                }}
              >
                <X size={14} className="mr-1" /> Reject
              </Button>
            </>
          )}
          {course.status === 'APPROVED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCourse(course);
                setConfirmAction({ action: 'archive', label: 'Archive Course' });
                setShowConfirmModal(true);
              }}
            >
              Archive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Course Management</h1>
          <p className="text-grey-dark mt-1">Review and manage all platform courses</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchCourses}>
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>Using mock data - API unavailable: {error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={courses}
            columns={columns}
            isLoading={loading}
            emptyMessage="No courses found"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>Next</Button>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedCourse?.title || 'Course Details'}
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Status</p>
                {getStatusBadge(selectedCourse.status)}
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Price</p>
                <p className="font-semibold text-navy">{formatCurrency(selectedCourse.price)}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Subject</p>
                <p className="font-medium">{selectedCourse.subject}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Exam Board</p>
                <p className="font-medium">{selectedCourse.examBoard || 'N/A'}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Students</p>
                <p className="font-medium">{selectedCourse.studentsCount || 0}</p>
              </div>
              <div className="p-3 bg-grey-light/50 rounded-lg">
                <p className="text-xs text-grey-medium">Rating</p>
                <p className="font-medium">{selectedCourse.rating > 0 ? `★ ${selectedCourse.rating.toFixed(1)}` : 'No ratings'}</p>
              </div>
            </div>
            <div className="p-3 bg-grey-light/50 rounded-lg">
              <p className="text-xs text-grey-medium">Instructor</p>
              <p className="font-medium">{selectedCourse.instructor?.user?.fullName || 'Unknown'}</p>
              <p className="text-xs text-grey-medium">{selectedCourse.instructor?.user?.email}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Action Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmAction.label}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-grey-dark">
            Are you sure you want to {confirmAction.action} <strong>{selectedCourse?.title}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button
              variant={confirmAction.action === 'reject' || confirmAction.action === 'archive' ? 'danger' : 'primary'}
              onClick={() => handleCourseAction(confirmAction.action, selectedCourse?.id)}
            >
              {confirmAction.label}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}