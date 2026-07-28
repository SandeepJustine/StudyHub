'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { MessageSquare, Send, ArrowLeft, Loader2, Tag, X } from 'lucide-react';
import Link from 'next/link';

const FORUMS = [
  { id: '1', name: 'MSCE Mathematics', subject: 'Mathematics' },
  { id: '2', name: 'Physics Study Group', subject: 'Physics' },
  { id: '3', name: 'English Literature', subject: 'English' },
  { id: '4', name: 'Chemistry Lab', subject: 'Chemistry' },
  { id: '5', name: 'Biology Corner', subject: 'Biology' },
  { id: '6', name: 'ICAM Study Hub', subject: 'Accounting' },
];

export default function NewThreadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    forumId: '',
    subject: '',
    tagsInput: '',
    tags: [] as string[],
  });

  if (status === 'loading') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'STUDENT') {
    router.push('/auth/login');
    return null;
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed], tagsInput: '' });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleTagsInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(formData.tagsInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add any remaining tag text
      if (formData.tagsInput.trim()) {
        addTag(formData.tagsInput);
      }

      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          forumId: formData.forumId || undefined,
          subject: formData.subject || undefined,
          tags: formData.tags,
        }),
      });

      if (!response.ok) throw new Error('Failed to create thread');

      setToast({ message: 'Discussion posted successfully!', type: 'success' });
      setTimeout(() => router.push('/student/community'), 1000);
    } catch (error) {
      setToast({ message: 'Failed to post discussion', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/student/community" className="text-grey-medium hover:text-navy">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare size={18} className="text-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">New Discussion</h1>
            <p className="text-sm text-grey-medium">Share your knowledge with the community</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Title *</label>
              <Input
                placeholder="What's your discussion about?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
              />
              <p className="text-xs text-grey-medium mt-1">{formData.title.length}/200</p>
            </div>

            {/* Forum Select */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Forum</label>
              <select
                value={formData.forumId}
                onChange={(e) => setFormData({ ...formData, forumId: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-grey-light rounded-lg text-sm focus:border-navy focus:ring-2 focus:ring-navy/20"
              >
                <option value="">General Discussion</option>
                {FORUMS.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name} ({forum.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Subject (optional)</label>
              <Input
                placeholder="e.g., Mathematics, Physics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">
                <Tag size={14} className="inline mr-1" />Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="info" size="sm" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter or comma)"
                value={formData.tagsInput}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                onKeyDown={handleTagsInput}
                disabled={formData.tags.length >= 5}
              />
              <p className="text-xs text-grey-medium mt-1">{formData.tags.length}/5 tags</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Content *</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[200px] text-sm resize-y"
                placeholder="Write your discussion here... Share your thoughts, questions, or tips!"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/student/community">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin mr-1" /> Posting...</>
            ) : (
              <><Send size={16} className="mr-1" /> Post Discussion</>
            )}
          </Button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}