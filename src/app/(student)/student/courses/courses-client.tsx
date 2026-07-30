'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, Users, Clock, ArrowRight, Filter } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import Link from 'next/link';

type CourseFilter = 'all' | 'institution' | 'independent';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  examBoard: string | null;
  grade: string | null;
  price: number;
  duration: number | null;
  rating: number;
  thumbnail: string | null;
  language: string;
  tags: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  instructor: {
    id: string;
    userId: string;
    user: {
      fullName: string;
      avatar: string | null;
    };
    rating: number;
    studentsCount: number;
  } | null;
  _count: {
    enrollments: number;
    reviews: number;
    modules: number;
  };
  isInstitutionCourse: boolean;
}

interface CourseFilterClientProps {
  courses: Course[];
  institutionId: string | null;
  institutionName: string | null;
  initialFilter: CourseFilter;
}

export function CourseFilterClient({ courses, institutionId, institutionName, initialFilter }: CourseFilterClientProps) {
  const [filter, setFilter] = useState<CourseFilter>(initialFilter);

  const { institutionCourses, independentCourses } = useMemo(() => {
    const inst: Course[] = [];
    const ind: Course[] = [];
    for (const course of courses) {
      if (course.isInstitutionCourse) {
        inst.push(course);
      } else {
        ind.push(course);
      }
    }
    return { institutionCourses: inst, independentCourses: ind };
  }, [courses]);

  const displayedCourses = useMemo(() => {
    if (filter === 'institution') return institutionCourses;
    if (filter === 'independent') return independentCourses;
    return [...institutionCourses, ...independentCourses];
  }, [filter, institutionCourses, independentCourses]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-xl"><BookOpen size={22} className="text-green" /></div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Explore Courses</h1>
            <p className="text-sm text-grey-medium">
              {institutionName 
                ? `Courses from ${institutionName} and independent instructors`
                : 'Discover courses to advance your learning'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={18} className="text-grey-medium" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-navy text-white' : 'bg-grey-light text-grey-dark hover:bg-grey-medium/20'
            }`}
          >
            All Courses
          </button>
          {institutionId && (
            <button
              onClick={() => setFilter('institution')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'institution' ? 'bg-navy text-white' : 'bg-grey-light text-grey-dark hover:bg-grey-medium/20'
              }`}
            >
              My Institution
            </button>
          )}
          <button
            onClick={() => setFilter('independent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'independent' ? 'bg-navy text-white' : 'bg-grey-light text-grey-dark hover:bg-grey-medium/20'
            }`}
          >
            Independent
          </button>
        </div>
        <span className="text-sm text-grey-medium ml-2">
          {displayedCourses.length} course{displayedCourses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Course Grid */}
      {displayedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCourses.map((course) => (
            <Link key={course.id} href={`/student/courses/${course.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info" size="sm">{course.subject}</Badge>
                    {course.examBoard && <Badge variant="neutral" size="sm">{course.examBoard}</Badge>}
                    {course.isInstitutionCourse && institutionId && (
                      <Badge variant="success" size="sm">Institution</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-navy mb-1 group-hover:text-red line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-grey-dark mb-3 line-clamp-2">{course.description || 'No description'}</p>
                  <div className="flex items-center gap-3 text-xs text-grey-medium mb-3">
                    <Clock size={12} />{formatDuration(course.duration || 0)}
                    <Users size={12} />{course._count?.enrollments || 0}
                    {course.rating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" />{course.rating.toFixed(1)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-navy">{course.price > 0 ? formatCurrency(course.price) : 'Free'}</span>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>View</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No Courses Found</h3>
            <p className="text-sm text-grey-dark">
              {filter === 'institution' 
                ? 'No courses available from your institution yet.' 
                : filter === 'independent'
                ? 'No independent courses available yet.'
                : 'No courses available yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
