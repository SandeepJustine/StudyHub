'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TeacherFormProps {
  teacher?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  } | null;
  onSubmit: (data: {
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ROLES = ['TEACHER', 'HEAD'];

export function TeacherForm({ teacher, onSubmit, onCancel, loading }: TeacherFormProps) {
  const isEdit = !!teacher;
  const [formData, setFormData] = useState({
    fullName: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    role: teacher?.role || 'TEACHER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
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
          placeholder="Enter teacher name"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          placeholder="teacher@example.com"
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

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-grey-dark mb-1.5">Role</label>
        <select
          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-navy"
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value })}
          disabled={loading}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>
              {r === 'TEACHER' ? 'Teacher' : 'Head'}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-grey-light">
        <Button variant="outline" onClick={onCancel} disabled={loading} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {isEdit ? 'Update Teacher' : 'Add Teacher'}
        </Button>
      </div>
    </form>
  );
}
