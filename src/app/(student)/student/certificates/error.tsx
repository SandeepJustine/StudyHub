'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-grey-light flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle size={48} className="mx-auto text-red mb-4" />
        <h2 className="text-xl font-bold text-navy mb-2">Something went wrong!</h2>
        <p className="text-grey-dark mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
