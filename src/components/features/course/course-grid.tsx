'use client';

import { useState } from 'react';
import { CourseCard } from './course-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';

interface CourseGridProps {
  courses: any[];
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  showFilters?: boolean;
}

export function CourseGrid({ courses, onEnroll, onView, showFilters = true }: CourseGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    examBoard: '',
    priceRange: 'all',
    rating: 0,
    sortBy: 'newest',
  });

  const subjects = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry'];
  const examBoards = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];

  const clearFilters = () => {
    setFilters({
      subject: '',
      examBoard: '',
      priceRange: 'all',
      rating: 0,
      sortBy: 'newest',
    });
    setSearchQuery('');
  };

  const activeFilterCount = [
    filters.subject,
    filters.examBoard,
    filters.priceRange !== 'all' ? 1 : 0,
    filters.rating > 0 ? 1 : 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {showFilters && (
            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
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
            className="px-3 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          <div className="flex border-2 border-grey-light rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-navy text-white' : 'text-grey-medium hover:bg-grey-light'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-navy text-white' : 'text-grey-medium hover:bg-grey-light'}`}
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
            <h3 className="font-semibold text-navy">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-red hover:text-red-700 flex items-center gap-1">
              <X size={14} />
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-xs font-medium text-grey-dark mb-1 block">Price Range</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="0-5000">MWK 0 - 5,000</option>
                <option value="5000-15000">MWK 5,000 - 15,000</option>
                <option value="15000+">MWK 15,000+</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-grey-dark mb-1 block">Min Rating</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) })}
              >
                <option value="0">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-navy mb-2">No courses found</h3>
          <p className="text-grey-dark mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {courses.map((course) => (
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