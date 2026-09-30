'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react'; // Assuming lucide-react based on project icons

export default function EditCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    subject: '',
    examBoard: '',
    grade: '',
    price: 0,
    language: 'en',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/instructor/courses/${courseId}`);
        if (!response.ok) throw new Error('Course not found');
        const result = await response.json();
        
        if (result.success && result.data) {
          const c = result.data;
          setCourseData({
            title: c.title || '',
            description: c.description || '',
            subject: c.subject || '',
            examBoard: c.examBoard || '',
            grade: c.grade || '',
            price: c.price || 0,
            language: c.language || 'en',
            tags: c.tags?.join(', ') || '',
          });
        } else {
          throw new Error(result.error || 'Failed to load');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) fetchCourse();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        ...courseData,
        tags: courseData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update course');
      }
      
      router.push('/instructor/courses'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center text-grey-dark">Loading course data...</div>;
  
  return (
    <div className="min-h-screen bg-grey-light p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/instructor/courses" className="text-navy hover:text-navy/80">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-navy">Edit Course</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Title</label>
            <input type="text" name="title" value={courseData.title} onChange={handleChange} required className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Description</label>
            <textarea name="description" rows={4} value={courseData.description} onChange={handleChange} required className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Subject</label>
              <input type="text" name="subject" value={courseData.subject} onChange={handleChange} required className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Grade</label>
              <input type="text" name="grade" value={courseData.grade} onChange={handleChange} className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Exam Board</label>
              <input type="text" name="examBoard" value={courseData.examBoard} onChange={handleChange} className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Price (MWK)</label>
              <input type="number" name="price" value={courseData.price} onChange={handleChange} required className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1">Tags (comma separated)</label>
            <input type="text" name="tags" value={courseData.tags} onChange={handleChange} className="w-full border border-grey-medium rounded-lg p-2 focus:ring-navy" />
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy/90 disabled:opacity-50">
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
