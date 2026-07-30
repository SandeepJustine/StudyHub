'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Video, Send, ArrowLeft, Loader2, Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function ScheduleLiveClassPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    date: '',
    time: '',
    duration: '60',
    maxParticipants: '100',
  });

  if (status === 'loading') {
    return (
      <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-navy" /></div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'INSTRUCTOR') {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) {
      setToast({ message: 'Title, date, and time are required', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`);
      
      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(formData.duration),
          maxParticipants: parseInt(formData.maxParticipants),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule class');
      }

      setToast({ message: 'Live class scheduled successfully!', type: 'success' });
      setTimeout(() => router.push('/instructor/live-classes'), 1000);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to schedule', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/instructor/live-classes" className="text-grey-medium hover:text-navy">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Video size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">Schedule Live Class</h1>
            <p className="text-sm text-grey-medium">Create a new live class session</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <Input
              label="Class Title *"
              placeholder="e.g., MSCE Math Revision Session"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-grey-dark mb-1">Description</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[100px] text-sm resize-y"
                placeholder="Describe what will be covered in this live class..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Input
              label="Subject"
              placeholder="e.g., Mathematics, Physics"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                leftIcon={<Calendar size={16} className="text-grey-medium" />}
              />
              <Input
                label="Time *"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                leftIcon={<Clock size={16} className="text-grey-medium" />}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                leftIcon={<Clock size={16} className="text-grey-medium" />}
                helperText="Typical: 60-120 minutes"
              />
              <Input
                label="Max Participants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                leftIcon={<Users size={16} className="text-grey-medium" />}
                helperText="Maximum students that can join"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Link href="/instructor/live-classes">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin mr-1" />Scheduling...</>
            ) : (
              <><Send size={16} className="mr-1" />Schedule Class</>
            )}
          </Button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}