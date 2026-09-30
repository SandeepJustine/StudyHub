'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  BookMarked,
  Clock,
  FlaskConical,
  Layers,
  Loader2,
  Plus,
  Search,
  Target,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AssignableExperiment {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  description?: string | null;
  duration: number;
  xpReward: number;
  _count: { steps: number };
}

interface SubjectAssignment {
  id: string;
  subject: string;
  createdAt: string;
  experiment: AssignableExperiment;
}

interface SubjectSummary {
  subject: string;
  count: number;
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: 'bg-purple-50 text-purple-600',
  Physics: 'bg-blue-50 text-blue-600',
  Biology: 'bg-emerald-50 text-emerald-600',
  Chemistry: 'bg-green-50 text-green',
  Agriculture: 'bg-yellow-50 text-yellow-600',
  Geography: 'bg-teal-50 text-teal-600',
  History: 'bg-orange-50 text-orange-600',
  'Computer Studies': 'bg-indigo-50 text-indigo-600',
  'Business Studies': 'bg-pink-50 text-pink-600',
  English: 'bg-slate-100 text-slate-600',
};

const difficultyVariant = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'success' as const;
    case 'intermediate':
      return 'warning' as const;
    case 'advanced':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
};

export function SubjectExperimentManager() {
  const [summary, setSummary] = useState<SubjectSummary[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [assignable, setAssignable] = useState<AssignableExperiment[]>([]);

  const [activeSubject, setActiveSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async (subject?: string) => {
    try {
      const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      const response = await fetch(`/api/instructor/experiments/subjects${query}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to load subject assignments');

      setSummary(data.subjects ?? []);
      setAssignments(data.assignments ?? []);
      setAssignable(data.assignableExperiments ?? []);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load subject assignments', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = useMemo(() => summary.map((s) => s.subject), [summary]);

  // Keep the active subject valid once the catalogue arrives.
  useEffect(() => {
    if (subjects.length === 0) return;
    if (!activeSubject || !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);

  // Reload the available-experiment list whenever the target subject changes,
  // because an experiment already used in one subject is still reusable in another.
  const changeSubject = useCallback(
    (subject: string) => {
      setActiveSubject(subject);
      void load(subject);
    },
    [load]
  );

  const visibleAssignments = useMemo(
    () => assignments.filter((a) => a.subject === activeSubject),
    [assignments, activeSubject]
  );

  const filteredAssignable = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assignable;
    return assignable.filter(
      (exp) =>
        exp.title.toLowerCase().includes(term) ||
        exp.subject.toLowerCase().includes(term) ||
        (exp.description ?? '').toLowerCase().includes(term)
    );
  }, [assignable, search]);

  const openModal = () => {
    setSelectedExperiment('');
    setSelectedSubject(activeSubject);
    setSearch('');
    setShowModal(true);
  };

  const handleAssign = async () => {
    if (!selectedExperiment || !selectedSubject) {
      setToast({ message: 'Select an experiment and a subject', type: 'error' });
      return;
    }

    setIsMutating(true);
    try {
      const response = await fetch('/api/instructor/experiments/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: selectedExperiment,
          subject: selectedSubject,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign experiment');

      setAssignments((prev) =>
        prev.some((a) => a.id === data.data.id) ? prev : [...prev, data.data]
      );
      setToast({
        message: `Assigned "${data.data.experiment.title}" to ${data.data.subject}`,
        type: 'success',
      });
      setShowModal(false);
      void load(selectedSubject);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to assign experiment', type: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnassign = async (assignment: SubjectAssignment) => {
    setIsMutating(true);
    try {
      const response = await fetch(`/api/instructor/experiments/subjects/${assignment.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove assignment');

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      setToast({
        message: `Removed "${assignment.experiment.title}" from ${assignment.subject}`,
        type: 'success',
      });
      void load(assignment.subject);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to remove assignment', type: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const totalAssignments = assignments.length;

  return (
    <div className="space-y-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <BookMarked size={22} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Subject Assignments</h2>
            <p className="text-sm text-grey-medium">
              Choose which existing experiments belong under each subject you teach
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={openModal} leftIcon={<Plus size={16} />}>
          Assign Experiment
        </Button>
      </div>

      {/* Subject chips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers size={16} className="text-navy" />
            Subjects ({totalAssignments} assignment{totalAssignments === 1 ? '' : 's'} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-grey-medium py-2">
              <Loader2 size={16} className="animate-spin" />
              Loading subjects…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => {
                const count = summary.find((s) => s.subject === subject)?.count ?? 0;
                const isActive = subject === activeSubject;

                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => changeSubject(subject)}
                    aria-pressed={isActive}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                      isActive
                        ? 'border-navy bg-navy text-white shadow-sm'
                        : 'border-grey-light bg-white text-grey-dark hover:border-navy/40 hover:bg-grey-light/50'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        count > 0
                          ? isActive
                            ? 'bg-white'
                            : 'bg-green'
                          : isActive
                            ? 'bg-white/40'
                            : 'bg-grey-medium'
                      )}
                    />
                    {subject}
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-white/20 text-white' : 'bg-grey-light text-grey-medium'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments for the active subject */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical size={16} className="text-navy" />
            {activeSubject || 'Select a subject'}
            <Badge variant="info" size="sm">
              {visibleAssignments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-grey-medium py-2">
              <Loader2 size={16} className="animate-spin" />
              Loading assignments…
            </div>
          ) : visibleAssignments.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical size={36} className="mx-auto text-grey-medium mb-3" />
              <p className="text-sm font-medium text-navy">No experiments assigned to {activeSubject}</p>
              <p className="text-xs text-grey-medium mt-1 mb-4">
                Assign an existing experiment so it appears under this subject.
              </p>
              <Button variant="outline" size="sm" onClick={openModal} leftIcon={<Plus size={14} />}>
                Assign Experiment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-wrap items-start justify-between gap-3 p-3 bg-grey-light/30 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy break-words">{assignment.experiment.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="info" size="sm">
                        {assignment.experiment.subject}
                      </Badge>
                      <Badge variant={difficultyVariant(assignment.experiment.difficulty)} size="sm">
                        {assignment.experiment.difficulty}
                      </Badge>
                      <span className="text-xs text-grey-medium flex items-center gap-1">
                        <Clock size={12} /> {assignment.experiment.duration} min
                      </span>
                      <span className="text-xs text-grey-medium flex items-center gap-1">
                        <Target size={12} /> {assignment.experiment.xpReward} XP
                      </span>
                      <span className="text-xs text-grey-medium">
                        {assignment.experiment._count.steps} steps
                      </span>
                    </div>
                    {assignment.experiment.description && (
                      <p className="text-xs text-grey-medium mt-1 line-clamp-2">
                        {assignment.experiment.description}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => void handleUnassign(assignment)}
                    title={`Remove from ${assignment.subject}`}
                  >
                    <X size={14} />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Assign Experiment to Subject"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-navy">
              This adds an <span className="font-medium">existing</span> experiment to a subject. No new experiments
              are created, and course/module assignments are untouched.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5" htmlFor="subject-assign-target">
              Subject
            </label>
            <select
              id="subject-assign-target"
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedExperiment('');
                void load(e.target.value);
              }}
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5" htmlFor="subject-assign-search">
              Search Experiments
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium pointer-events-none"
              />
              <input
                id="subject-assign-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, lab type or description"
                className="w-full pl-9 pr-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Select Experiment
            </label>
            {filteredAssignable.length === 0 ? (
              <p className="text-sm text-grey-medium py-3 px-3 bg-grey-light/40 rounded-lg">
                No experiments available to assign to this subject.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-grey-light divide-y divide-grey-light">
                {filteredAssignable.map((exp) => (
                  <label
                    key={exp.id}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer transition-colors',
                      selectedExperiment === exp.id ? 'bg-navy/5' : 'hover:bg-grey-light/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="subject-experiment"
                      value={exp.id}
                      checked={selectedExperiment === exp.id}
                      onChange={() => setSelectedExperiment(exp.id)}
                      className="mt-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy break-words">{exp.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="neutral" size="sm">
                          {exp.subject}
                        </Badge>
                        <Badge variant={difficultyVariant(exp.difficulty)} size="sm">
                          {exp.difficulty}
                        </Badge>
                        <span className="text-xs text-grey-medium">{exp._count.steps} steps</span>
                        <span className="text-xs text-grey-medium">{exp.duration} min</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-grey-light">
            <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              loading={isMutating}
              disabled={!selectedExperiment || !selectedSubject}
              className="w-full sm:w-auto"
            >
              Assign to {selectedSubject || 'subject'}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SubjectExperimentManager;