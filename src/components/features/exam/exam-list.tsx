'use client';

import { useState } from 'react';
import { ExamCard } from './exam-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  subject: string;
  examBoard: string;
  questionsCount: number;
  duration: number;
  passingScore: number;
  attemptsCount: number;
  maxAttempts: number;
  lastScore?: number;
  lastAttemptDate?: Date;
  isAvailable: boolean;
}

interface ExamListProps {
  exams: Exam[];
  onStartExam: (examId: string) => void;
  onViewResults?: (examId: string) => void;
  showFilters?: boolean;
}

export function ExamList({ exams, onStartExam, onViewResults, showFilters = true }: ExamListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    examBoard: '',
    status: 'all',
  });

  const subjects = [...new Set(exams.map(e => e.subject))];
  const examBoards = [...new Set(exams.map(e => e.examBoard))];

  const clearFilters = () => {
    setFilters({ subject: '', examBoard: '', status: 'all' });
    setSearchQuery('');
  };

  const activeFilterCount = [
    filters.subject,
    filters.examBoard,
    filters.status !== 'all' ? 1 : 0,
  ].filter(Boolean).length;

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = !searchQuery || 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = !filters.subject || exam.subject === filters.subject;
    const matchesBoard = !filters.examBoard || exam.examBoard === filters.examBoard;
    
    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'attempted' && exam.attemptsCount > 0) ||
      (filters.status === 'not_attempted' && exam.attemptsCount === 0) ||
      (filters.status === 'passed' && exam.lastScore && exam.lastScore >= exam.passingScore) ||
      (filters.status === 'failed' && exam.lastScore && exam.lastScore < exam.passingScore);

    return matchesSearch && matchesSubject && matchesBoard && matchesStatus;
  });

  // Group by exam board
  const groupedExams = filteredExams.reduce((acc, exam) => {
    if (!acc[exam.examBoard]) {
      acc[exam.examBoard] = [];
    }
    acc[exam.examBoard].push(exam);
    return acc;
  }, {} as Record<string, Exam[]>);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
          <Input
            placeholder="Search exams..."
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
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-grey-light animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Filter Exams</h3>
            <button onClick={clearFilters} className="text-sm text-red hover:text-red-700 flex items-center gap-1">
              <X size={14} />
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-xs font-medium text-grey-dark mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 border border-grey-light rounded-lg text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All</option>
                <option value="attempted">Attempted</option>
                <option value="not_attempted">Not Attempted</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Exam List */}
      {Object.keys(groupedExams).length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-navy mb-2">No exams found</h3>
          <p className="text-grey-dark mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedExams).map(([board, boardExams]) => (
            <div key={board}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-navy">{board}</h3>
                <Badge variant="neutral">{boardExams.length} exams</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boardExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    {...exam}
                    onStart={onStartExam}
                    onViewResults={onViewResults}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}