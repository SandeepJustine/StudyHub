'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture'];

export default function UploadPastPaperPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    examBoard: '',
    year: '',
    paperNumber: '1',
    duration: '180',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Upload file
      if (!file) {
        throw new Error('Please select a file');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', file.type === 'application/pdf' ? 'PDF' : 'DOC');

      const uploadRes = await fetch('/api/upload/past-paper', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Failed to upload file');
      }

      const uploadResult = await uploadRes.json();
      setUploadProgress(50);

      // Step 2: Create past paper record
      const paperRes = await fetch('/api/past-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          paperNumber: parseInt(formData.paperNumber),
          duration: parseInt(formData.duration),
          fileUrl: uploadResult.data.url,
          contentType: uploadResult.data.contentType,
          fileSize: uploadResult.data.size,
        }),
      });

      if (!paperRes.ok) {
        const err = await paperRes.json();
        throw new Error(err.error || 'Failed to create past paper');
      }

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => router.push('/instructor/past-papers'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Upload Successful!</h2>
          <p className="text-grey-dark">Your past paper has been uploaded and is now available to students.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/past-papers">
          <Button variant="ghost" size="xs" className="h-9 w-9 p-0"><ArrowLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy">Upload Past Paper</h1>
          <p className="text-sm text-grey-medium">Share past papers with your students</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., MSCE Mathematics 2024 Paper 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  required
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Exam Board</label>
                <select
                  value={formData.examBoard}
                  onChange={(e) => setFormData({ ...formData, examBoard: e.target.value })}
                  className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  required
                >
                  <option value="">Select exam board</option>
                  {EXAM_BOARDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Year</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                  min="1990"
                  max="2030"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Paper Number</label>
                <Input
                  type="number"
                  value={formData.paperNumber}
                  onChange={(e) => setFormData({ ...formData, paperNumber: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-2">Upload File (PDF or DOC)</label>
              <div className="border-2 border-dashed border-grey-light rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-grey-medium mb-2" />
                  <p className="text-sm text-grey-dark">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-grey-medium mt-1">PDF or DOC (max 50MB)</p>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-grey-light rounded-full h-2">
                  <div
                    className="bg-navy h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-grey-medium text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/instructor/past-papers" className="flex-1">
                <Button variant="outline" fullWidth disabled={isUploading}>Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" fullWidth loading={isUploading}>
                <Upload size={16} className="mr-1" />
                Upload Past Paper
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
