'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { CourseForm } from '@/components/features/institution/course-form';
import {
  Search, Plus, Edit, Trash2, Eye, BookOpen,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subject: string;
  grade: string;
  enrolledStudents: number;
  status: 'active' | 'draft' | 'archived';
  instructor: string;
  instructorId?: string;
  lastUpdated: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/institutions/courses');
      if (!res.ok) {
        const result = await res.json().catch(() => ({ error: 'Failed to load courses' }));
        throw new Error(result.error || `Server error ${res.status}`);
      }
      const result = await res.json();
      if (result.success) {
        setCourses(result.data);
      } else {
        setToast({ message: result.error || 'Failed to load courses', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load courses', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/institutions/teachers');
      const data = await res.json();
      if (data.success) {
        setInstructors(data.data.map((t: any) => ({ id: t.id, name: t.name, email: t.email })));
      }
    } catch {
      // ignore
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = async (data: {
    title: string;
    subject: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status: 'active' | 'draft' | 'archived';
    instructorId?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/institutions/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({ error: 'Failed to create course' }));
        throw new Error(result.error || `Server error ${res.status}`);
      }
      const result = await res.json();
      if (result.success) {
        setToast({ message: 'Course created successfully!', type: 'success' });
        setShowAddModal(false);
        fetchCourses();
      } else {
        setToast({ message: result.error || 'Failed to create course', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create course', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourse = async (data: {
    title: string;
    subject: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status: 'active' | 'draft' | 'archived';
    instructorId?: string;
  }) => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/institutions/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({ error: 'Failed to update course' }));
        throw new Error(result.error || `Server error ${res.status}`);
      }
      const result = await res.json();
      if (result.success) {
        setToast({ message: 'Course updated successfully!', type: 'success' });
        setShowEditModal(false);
        setSelectedCourse(null);
        fetchCourses();
      } else {
        setToast({ message: result.error || 'Failed to update course', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update course', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;
    try {
      const res = await fetch(`/api/institutions/courses/${course.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({ error: 'Failed to delete course' }));
        throw new Error(result.error || `Server error ${res.status}`);
      }
      const result = await res.json();
      if (result.success) {
        setToast({ message: 'Course deleted successfully!', type: 'success' });
        fetchCourses();
      } else {
        setToast({ message: result.error || 'Failed to delete course', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete course', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'draft':
        return <Badge variant="warning" size="sm">Draft</Badge>;
      case 'archived':
        return <Badge variant="info" size="sm">Archived</Badge>;
      default:
        return <Badge variant="info" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Courses</h1>
          <p className="text-grey-medium mt-1">Manage courses for your institution</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => { fetchInstructors(); setShowAddModal(true); }}>
          Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" size={18} />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-grey-light rounded animate-pulse"></div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-grey-medium mb-3" />
              <p className="text-grey-medium">No courses found</p>
              <p className="text-sm text-grey-medium mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a course'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-grey-light">
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Course</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Subject</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Grade</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Instructor</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Students</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Status</th>
                    <th className="text-left py-3 text-sm font-medium text-grey-dark">Updated</th>
                    <th className="text-right py-3 text-sm font-medium text-grey-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b border-grey-light/50">
                      <td className="py-3">
                        <div className="font-medium text-navy">{course.title}</div>
                      </td>
                      <td className="py-3 text-grey-dark">{course.subject}</td>
                      <td className="py-3 text-grey-dark">{course.grade}</td>
                      <td className="py-3 text-grey-dark">{course.instructor}</td>
                      <td className="py-3 text-grey-dark">{course.enrolledStudents}</td>
                      <td className="py-3">{getStatusBadge(course.status)}</td>
                      <td className="py-3 text-grey-dark">
                        {new Date(course.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowViewModal(true);
                            }}
                          >
                            View
                          </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             leftIcon={<Edit size={14} />}
                             onClick={() => {
                               setSelectedCourse(course);
                               fetchInstructors();
                               setShowEditModal(true);
                             }}
                           >
                             Edit
                           </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => handleDeleteCourse(course)}
                            className="text-red hover:bg-red/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Course Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Course"
        size="lg"
      >
        <CourseForm
          course={null}
          instructors={instructors}
          onSubmit={handleAddCourse}
          onCancel={() => setShowAddModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCourse(null);
        }}
        title="Edit Course"
        size="lg"
      >
        {selectedCourse && (
          <CourseForm
            course={selectedCourse}
            instructors={instructors}
            onSubmit={handleEditCourse}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedCourse(null);
            }}
            loading={saving}
          />
        )}
      </Modal>

      {/* View Course Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCourse(null);
        }}
        title="Course Details"
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-grey-medium">Title</label>
              <p className="font-medium text-navy">{selectedCourse.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-grey-medium">Subject</label>
                <p className="font-medium text-navy">{selectedCourse.subject}</p>
              </div>
              <div>
                <label className="text-sm text-grey-medium">Grade</label>
                <p className="font-medium text-navy">{selectedCourse.grade}</p>
              </div>
              <div>
                <label className="text-sm text-grey-medium">Instructor</label>
                <p className="font-medium text-navy">{selectedCourse.instructor}</p>
              </div>
              <div>
                <label className="text-sm text-grey-medium">Enrolled Students</label>
                <p className="font-medium text-navy">{selectedCourse.enrolledStudents}</p>
              </div>
              <div>
                <label className="text-sm text-grey-medium">Status</label>
                <div>{getStatusBadge(selectedCourse.status)}</div>
              </div>
              <div>
                <label className="text-sm text-grey-medium">Last Updated</label>
                <p className="font-medium text-navy">
                  {new Date(selectedCourse.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
