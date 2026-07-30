'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { MessageSquare, Send, ArrowLeft, Loader2, Tag, X, Megaphone } from 'lucide-react';
import Link from 'next/link';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    tagsInput: '',
    tags: [] as string[],
  });

  useEffect(() => {
    fetch('/api/instructor/courses').then(r => r.json()).then(d => {
      if (d.success) setCourses(d.data || []);
    }).catch(() => {});
  }, []);

  if (status === 'loading') return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'INSTRUCTOR') { router.push('/auth/login'); return null; }

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !formData.tags.includes(t) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, t], tagsInput: '' });
    }
  };

  const removeTag = (tag: string) => setFormData({ ...formData, tags: formData.tags.filter(x => x !== tag) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (formData.tagsInput.trim()) addTag(formData.tagsInput);
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          courseId: formData.courseId || undefined,
          tags: [...formData.tags, 'announcement'],
          isPinned: true,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setToast({ message: 'Announcement posted!', type: 'success' });
      setTimeout(() => router.push('/instructor/community'), 1000);
    } catch (e: any) { setToast({ message: e.message || 'Failed', type: 'error' }); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/instructor/community" className="text-grey-medium hover:text-navy"><ArrowLeft size={18} /></Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg"><Megaphone size={18} className="text-purple-600" /></div>
          <div><h1 className="text-xl font-bold text-navy">Create Announcement</h1><p className="text-sm text-grey-medium">Post an announcement to your students</p></div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4">
          <div><label className="block text-sm font-medium text-grey-dark mb-1">Title *</label><Input placeholder="Announcement title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required maxLength={200} /></div>
          <div><label className="block text-sm font-medium text-grey-dark mb-1">Course</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-4 py-2.5 border-2 border-grey-light rounded-lg text-sm">
              <option value="">All Courses</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-grey-dark mb-1">Content *</label><textarea className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[200px] text-sm resize-y" placeholder="Write your announcement..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required /></div>
        </CardContent></Card>
        <div className="flex items-center justify-between">
          <Link href="/instructor/community"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button variant="primary" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-1" />Posting...</> : <><Send size={16} className="mr-1" />Post Announcement</>}
          </Button>
        </div>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}