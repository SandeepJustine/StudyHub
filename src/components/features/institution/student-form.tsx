'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface StudentFormProps {
  student?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    grade?: string;
    examBoard?: string;
    subjects: string[];
  } | null;
  onSubmit: (data: {
    fullName: string;
    email: string;
    phone?: string;
    grade?: string;
    examBoard?: string;
    subjects: string[];
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

export function StudentForm({ student, onSubmit, onCancel, loading }: StudentFormProps) {
  const isEdit = !!student;
  const [formData, setFormData] = useState({
    fullName: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    grade: student?.grade || '',
    examBoard: student?.examBoard || '',
    subjects: student?.subjects || [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (formData.subjects.length === 0) newErrors.subjects = 'Select at least one subject';
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
      {/* Name & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="Enter student name"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          placeholder="student@example.com"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          disabled={loading}
        />
      </div>

      {/* Phone */}
      <Input
        label="Phone"
        placeholder="+265 888 000 000"
        value={formData.phone}
        onChange={e => setFormData({ ...formData, phone: e.target.value })}
        disabled={loading}
      />

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
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.grade && <p className="mt-1.5 text-sm text-red">{errors.grade}</p>}
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
            {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <label className="block text-sm font-medium text-grey-dark mb-1.5">Subjects</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SUBJECTS.map(s => (
            <label key={s} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-grey-light/50">
              <input
                type="checkbox"
                checked={formData.subjects.includes(s)}
                onChange={() => handleSubjectToggle(s)}
                disabled={loading}
                className="rounded border-grey-light text-navy focus:ring-navy"
              />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
        {formData.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {formData.subjects.map(s => (
              <Badge key={s} variant="info" size="sm">{s}</Badge>
            ))}
          </div>
        )}
        {errors.subjects && <p className="mt-1.5 text-sm text-red">{errors.subjects}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
        <Button variant="outline" onClick={onCancel} disabled={loading} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {isEdit ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}
