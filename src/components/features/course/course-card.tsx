import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
    subject: string;
    price: number;
    thumbnail?: string;
    rating: number;
    reviewsCount: number;
    studentsCount: number;
    duration: number;
    instructor: {
      user: {
        fullName: string;
        avatar?: string;
      };
    };
  };
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
}

export function CourseCard({ course, onEnroll, onView }: CourseCardProps) {
  return (
    <Card hover padding="none" className="overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-48 bg-navy/5">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen size={48} className="text-grey-medium" />
          </div>
        )}
        {course.price > 0 && (
          <Badge
            variant="info"
            className="absolute top-3 right-3"
          >
            {formatCurrency(course.price)}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="neutral" size="sm">{course.subject}</Badge>
          {course.rating > 0 && (
            <div className="flex items-center gap-1 text-sm text-grey-dark">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              {course.rating.toFixed(1)}
              <span className="text-grey-medium">({course.reviewsCount})</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-navy mb-2 line-clamp-2">{course.title}</h3>

        <div className="flex items-center gap-4 text-sm text-grey-medium mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDuration(course.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {course.studentsCount} students
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
              <span className="text-xs font-medium text-navy">
                {course.instructor.user.fullName.charAt(0)}
              </span>
            </div>
            <span className="text-sm text-grey-dark">
              {course.instructor.user.fullName}
            </span>
          </div>

          <div className="flex gap-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(course.id)}
              >
                Preview
              </Button>
            )}
            {onEnroll && (
              <Button
                variant={course.price > 0 ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onEnroll(course.id)}
              >
                {course.price > 0 ? 'Enroll Now' : 'Start Free'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}