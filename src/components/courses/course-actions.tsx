'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { CheckCircle, ChevronRight, Loader2, Play, Heart } from 'lucide-react';
import Link from 'next/link';

interface CourseActionsProps {
  courseId: string;
  price: number;
  isEnrolled: boolean;
  enrollmentProgress?: number;
  enrollmentId?: string;
}

export function CourseActions({ 
  courseId, 
  price, 
  isEnrolled: initialEnrolled, 
  enrollmentProgress = 0,
  enrollmentId,
}: CourseActionsProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(enrollmentProgress);

  const handleEnroll = async () => {
    // For paid courses, redirect to the course details page
    // where the student can select a payment method
    if (price > 0) {
      router.push(`/student/courses/${courseId}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrollment failed');
      }

      setIsEnrolled(true);
      setToast({ message: 'Successfully enrolled! Start learning now.', type: 'success' });
      
      // Refresh to update server state
      setTimeout(() => router.refresh(), 1000);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to enroll', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    setToast({ 
      message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!', 
      type: 'success' 
    });
  };

  const handlePreview = (moduleId: string) => {
    router.push(`/student/courses/${courseId}/learn?module=${moduleId}&preview=true`);
  };

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <CheckCircle size={20} className="mx-auto text-green mb-1" />
          <p className="font-medium text-green">You're enrolled!</p>
          {progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-grey-light rounded-full h-1.5">
                <div 
                  className="bg-green rounded-full h-1.5" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>
        <Link href={`/student/courses/${courseId}/learn`}>
          <Button variant="primary" fullWidth size="lg">
            Continue Learning <ChevronRight size={20} className="ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button 
        variant="primary" 
        fullWidth 
        size="lg" 
        onClick={handleEnroll}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin mr-2" />
        ) : null}
        {price > 0 ? 'Enroll Now' : 'Start Learning Free'}
      </Button>
      
      <Button 
        variant="outline" 
        fullWidth 
        onClick={handleWishlist}
      >
        <Heart 
          size={16} 
          className={`mr-2 ${isWishlisted ? 'fill-red text-red' : ''}`} 
        />
        {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
      </Button>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}