'use client';

import { useState } from 'react';
import { CourseCard } from './course-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Grid, List, SlidersHorizontal, X, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description?: string;
  subject: string;
  examBoard?: string;
  grade?: string;
  price: number;
  thumbnail?: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  modulesCount: number;
  status?: string;
  instructor: {
    id: string;
    user: {
      fullName: string;
      avatar?: string;
    };
    rating?: number;
    studentsCount?: number;
  };
}

interface CourseListProps {
  courses: Course[];
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  showFilters?: boolean;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
}

export function CourseList({
  courses,
  onEnroll,
  onView,
  onEdit,
  showFilters = true,
  isLoading = false,
  viewMode: initialViewMode = 'grid',
  emptyMessage = 'No courses found',
  emptyAction,
}: CourseListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    examBoard: '',
    grade: '',
    priceRange: 'all',
    rating: 0,
    sortBy: 'newest',
  });

  // Extract unique values for filters
  const subjects = [...new Set(courses.map(c => c.subject))].filter(Boolean).sort();
  const examBoards = [...new Set(courses.map(c => c.examBoard))].filter(Boolean).sort();
  const grades = [...new Set(courses.map(c => c.grade))].filter(Boolean).sort();

  const clearFilters = () => {
    setFilters({
      subject: '',
      examBoard: '',
      grade: '',
      priceRange: 'all',
      rating: 0,
      sortBy: 'newest',
    });
    setSearchQuery('');
  };

  const activeFilterCount = [
    filters.subject,
    filters.examBoard,
    filters.grade,
    filters.priceRange !== 'all' ? 1 : 0,
    filters.rating > 0 ? 1 : 0,
  ].filter(Boolean).length;

  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = !filters.subject || course.subject === filters.subject;
      const matchesBoard = !filters.examBoard || course.examBoard === filters.examBoard;
      const matchesGrade = !filters.grade || course.grade === filters.grade;
      const matchesRating = !filters.rating || course.rating >= filters.rating;

      let matchesPrice = true;
      if (filters.priceRange === 'free') {
        matchesPrice = course.price === 0;
      } else if (filters.priceRange === 'paid') {
        matchesPrice = course.price > 0;
      } else if (filters.priceRange === '0-5000') {
        matchesPrice = course.price <= 5000;
      } else if (filters.priceRange === '5000-15000') {
        matchesPrice = course.price > 5000 && course.price <= 15000;
      } else if (filters.priceRange === '15000+') {
        matchesPrice = course.price > 15000;
      }

      return matchesSearch && matchesSubject && matchesBoard && matchesGrade && matchesRating && matchesPrice;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          return b.studentsCount - a.studentsCount;
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0; // newest first by default
      }
    });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md">
              <Skeleton className="h-48 w-full" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
          <Input
            placeholder="Search courses by title, subject, or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-medium hover:text-grey-dark"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {showFilters && (
            <Button
              variant="outline"
              leftIcon={<SlidersHorizontal size={16} />}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="error" size="sm" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
          
          <select
            className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm bg-white"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="title">Alphabetical</option>
          </select>

          <div className="flex border-2 border-grey-light rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-navy text-white' 
                  : 'text-grey-medium hover:bg-grey-light'
              }`}
              title="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-navy text-white' 
                  : 'text-grey-medium hover:bg-grey-light'
              }`}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-grey-light animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Filter Courses</h3>
            <button 
              onClick={clearFilters} 
              className="text-sm text-red hover:text-red-700 flex items-center gap-1"
            >
              <X size={14} />
              Clear all filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-grey-dark mb-1 block">Subject</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-grey-dark mb-1 block">Exam Board</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.examBoard}
                onChange={(e) => setFilters({ ...filters, examBoard: e.target.value })}
              >
                <option value="">All Boards</option>
                {examBoards.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-grey-dark mb-1 block">Grade</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              >
                <option value="">All Grades</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-grey-dark mb-1 block">Price Range</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="0-5000">MWK 0 - 5,000</option>
                <option value="5000-15000">MWK 5,000 - 15,000</option>
                <option value="15000+">MWK 15,000+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey-medium">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            {activeFilterCount > 0 && ' (filtered)'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Course Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={64} className="mx-auto text-grey-medium mb-4" />
          <h3 className="text-xl font-semibold text-navy mb-2">{emptyMessage}</h3>
          <p className="text-grey-dark mb-4">Try adjusting your search or filters</p>
          <div className="flex gap-3 justify-center">
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            {emptyAction && (
              <Button variant="primary" onClick={emptyAction.onClick}>
                {emptyAction.label}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={onEnroll}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}