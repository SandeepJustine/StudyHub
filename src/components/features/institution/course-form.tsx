'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CourseFormProps {
  course?: {
    id?: string;
    title: string;
    subject: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status: 'active' | 'draft' | 'archived';
    instructorId?: string;
  } | null;
  instructors?: Array<{ id: string; name: string; email: string }>;
  onSubmit: (data: {
    title: string;
    subject: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status: 'active' | 'draft' | 'archived';
    instructorId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const SUBJECTS = [
  'Mathematics', 'English', 'Physics', 'Biology',
  'Chemistry', 'Geography', 'History', 'French',
  'Computer Science', 'Art',
];

const GRADES = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];

export function CourseForm({ course, instructors = [], onSubmit, onCancel, loading }: CourseFormProps) {
  const isEdit = !!course;
  const [formData, setFormData] = useState({
    title: course?.title || '',
    subject: course?.subject || '',
    grade: course?.grade || '',
    description: course?.description || '',
    examBoard: course?.examBoard || '',
    price: course?.price || 0,
    status: course?.status || 'draft',
    instructorId: course?.instructorId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Course title is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Subject */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Course Title"
          placeholder="e.g. Advanced Mathematics"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          disabled={loading}
        />
        <div>
          <label className="block text-sm font-medium text-grey-dark mb-1.5">Subject</label>
          <select
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy"
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
            disabled={loading}
          >
            <option value="">Select subject</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.subject && <p className="mt-1.5 text-sm text-red">{errors.subject}</p>}
        </div>
      </div>

      {/* Grade & Exam Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-grey-dark mb-1.5">Grade</label>
          <select
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy"
            value={formData.grade}
            onChange={e => setFormData({ ...formData, grade: e.target.value })}
            disabled={loading}
          >
            <option value="">Select grade</option>
            {GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-grey-dark mb-1.5">Exam Board</label>
          <select
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy"
            value={formData.examBoard}
            onChange={e => setFormData({ ...formData, examBoard: e.target.value })}
            disabled={loading}
          >
            <option value="">Select board</option>
            {EXAM_BOARDS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Instructor Assignment */}
      <div>
        <label className="block text-sm font-medium text-grey-dark mb-1.5">Assign Instructor</label>
        <select
          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy"
          value={formData.instructorId}
          onChange={e => setFormData({ ...formData, instructorId: e.target.value })}
          disabled={loading}
        >
          <option value="">Select instructor (optional)</option>
          {instructors.map(i => (
            <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
          ))}
        </select>
        <p className="text-xs text-grey-medium mt-1">Leave empty to assign to the first available teacher</p>
      </div>

      {/* Price */}
      <Input
        label="Price (MWK)"
        type="number"
        placeholder="0 for free course"
        value={formData.price}
        onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
        disabled={loading}
      />

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-grey-dark mb-1.5">Status</label>
        <div className="flex gap-3">
          {(['draft', 'active', 'archived'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFormData({ ...formData, status: s })}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.status === s
                  ? 'bg-navy text-white'
                  : 'bg-grey-light text-grey-dark hover:bg-grey-medium/20'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-grey-dark mb-1.5">Description</label>
        <textarea
          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy resize-y min-h-[100px]"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter course description..."
          disabled={loading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
        <Button variant="outline" onClick={onCancel} disabled={loading} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {isEdit ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
