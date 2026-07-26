'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CourseCard } from '@/components/features/course/course-card';
import { Search, Filter, Grid, List } from 'lucide-react';

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    query: '',
    subject: '',
    examBoard: '',
    priceRange: 'all',
    sortBy: 'newest',
  });

  const subjects = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography'];
  const examBoards = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.examBoard) params.append('examBoard', filters.examBoard);
      params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();
      setCourses(data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search courses..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
              value={filters.examBoard}
              onChange={(e) => setFilters({ ...filters, examBoard: e.target.value })}
            >
              <option value="">All Boards</option>
              {examBoards.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-grey-light rounded-t-xl" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-grey-light rounded w-3/4" />
                <div className="h-3 bg-grey-light rounded w-1/2" />
                <div className="h-3 bg-grey-light rounded w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">No courses found</h3>
          <p className="text-grey-dark">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {courses.map((course: any) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={(id) => router.push(`/student/courses/${id}/enroll`)}
              onView={(id) => router.push(`/student/courses/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {courses.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="primary" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      )}
    </div>
  );
}