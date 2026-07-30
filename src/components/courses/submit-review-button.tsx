'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Send, Loader2, CheckCircle } from 'lucide-react';

export function SubmitReviewButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async () => {
    if (!confirm('Submit this course for admin review? Once submitted, you cannot edit it until reviewed.')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/submit`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit course');
      }

      setIsSubmitted(true);
      setToast({ message: 'Course submitted for review successfully!', type: 'success' });
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
      
    } catch (e: any) {
      setToast({ message: e.message || 'Failed to submit course', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isSubmitted ? (
        <Button variant="success" size="sm" disabled>
          <CheckCircle size={14} className="mr-1" />
          Submitted for Review
        </Button>
      ) : (
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin mr-1" />
          ) : (
            <Send size={14} className="mr-1" />
          )}
          Submit for Review
        </Button>
      )}
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}