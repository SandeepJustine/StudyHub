import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl h-48',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-grey-light',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <Skeleton className="w-3/4 h-6 mb-4" />
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-5/6 h-4 mb-4" />
      <Skeleton variant="rectangular" className="w-full h-40 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <div className="flex gap-4 p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="flex-1 h-4" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="w-1/3 h-8 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-md">
            <Skeleton className="w-1/2 h-4 mb-3" />
            <Skeleton className="w-3/4 h-8 mb-2" />
            <Skeleton className="w-1/3 h-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-md">
            <Skeleton className="w-1/2 h-6 mb-4" />
            <Skeleton className="w-full h-64" />
          </div>
        ))}
      </div>
    </div>
  );
}