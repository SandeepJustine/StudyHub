'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  FlaskConical,
  Plus,
  X,
  CheckCircle,
  Microscope,
  Clock,
  Target,
} from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  description?: string | null;
  duration: number;
  xpReward: number;
  status: string;
  courseId?: string | null;
  moduleId?: string | null;
  course?: { id: string; title: string } | null;
  module?: { id: string; title: string } | null;
  steps: { id: string; order: number }[];
  _count: { attempts: number };
}

interface Course {
  id: string;
  title: string;
  subject: string;
  modules: { id: string; title: string; contentType: string; order: number }[];
  _count: { modules: number; enrollments: number };
}

interface ExperimentManagerProps {
  experiments: Experiment[];
  courses: Course[];
}

export function ExperimentManager({ experiments, courses }: ExperimentManagerProps) {
  const [localExperiments, setLocalExperiments] = useState(experiments);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const assignedExperiments = localExperiments.filter((e) => e.courseId);
  const unassignedExperiments = localExperiments.filter((e) => !e.courseId);

  const handleAssign = async () => {
    if (!selectedExperiment || !selectedCourse) {
      setToast({ message: 'Please select an experiment and a course', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/instructor/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: selectedExperiment,
          courseId: selectedCourse,
          moduleId: selectedModule || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign experiment');

      // Update local state
      setLocalExperiments((prev) =>
        prev.map((exp) => {
          if (exp.id === selectedExperiment) {
            const course = courses.find((c) => c.id === selectedCourse);
            const module_ = course?.modules.find((m) => m.id === selectedModule);
            return {
              ...exp,
              courseId: selectedCourse,
              moduleId: selectedModule || null,
              course: { id: selectedCourse, title: course?.title || '' },
              module: selectedModule
                ? { id: selectedModule, title: module_?.title || '' }
                : null,
            };
          }
          return exp;
        }),
      );

      setToast({ message: 'Experiment assigned successfully', type: 'success' });
      setShowAssignModal(false);
      setSelectedExperiment('');
      setSelectedCourse('');
      setSelectedModule('');
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to assign experiment', type: 'error' });
    }
  };

  const handleUnassign = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/instructor/experiments/${experimentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to unassign experiment');

      setLocalExperiments((prev) =>
        prev.map((exp) =>
          exp.id === experimentId
            ? { ...exp, courseId: null, moduleId: null, course: null, module: null }
            : exp,
        ),
      );

      setToast({ message: 'Experiment unassigned', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to unassign experiment', type: 'error' });
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge variant="success" size="sm">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="warning" size="sm">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="error" size="sm">Advanced</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{difficulty}</Badge>;
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      chemistry: 'text-green-600',
      physics: 'text-blue-600',
      biology: 'text-emerald-600',
      mathematics: 'text-purple-600',
    };
    return colors[subject.toLowerCase()] || 'text-grey-600';
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Microscope size={22} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">All Experiments</h2>
            <p className="text-sm text-grey-medium">
              View and assign experiments to your courses and modules
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAssignModal(true)}
          leftIcon={<Plus size={16} />}
        >
          Assign Experiment
        </Button>
      </div>

      {/* Assigned Experiments */}
      {assignedExperiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Assigned Experiments ({assignedExperiments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical size={18} className={getSubjectColor(exp.subject)} />
                    <div>
                      <p className="text-sm font-medium text-navy">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="info" size="sm">{exp.subject}</Badge>
                        {getDifficultyBadge(exp.difficulty)}
                        <span className="text-xs text-grey-medium flex items-center gap-1">
                          <Clock size={12} /> {exp.duration} min
                        </span>
                        <span className="text-xs text-grey-medium flex items-center gap-1">
                          <Target size={12} /> {exp.xpReward} XP
                        </span>
                        <span className="text-xs text-grey-medium">
                          {exp.steps?.length || 0} steps
                        </span>
                      </div>
                      <p className="text-xs text-grey-medium mt-1">
                        Assigned to: {exp.course?.title || 'Unknown course'}
                        {exp.module?.title && ` > Module: ${exp.module.title}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      <CheckCircle size={12} className="mr-1" /> Assigned
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleUnassign(exp.id)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Experiments */}
      {unassignedExperiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Available Experiments ({unassignedExperiments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical size={18} className="text-grey-medium" />
                    <div>
                      <p className="text-sm font-medium text-navy">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="info" size="sm">{exp.subject}</Badge>
                        {getDifficultyBadge(exp.difficulty)}
                        <span className="text-xs text-grey-medium flex items-center gap-1">
                          <Clock size={12} /> {exp.duration} min
                        </span>
                        <span className="text-xs text-grey-medium flex items-center gap-1">
                          <Target size={12} /> {exp.xpReward} XP
                        </span>
                        <span className="text-xs text-grey-medium">
                          {exp.steps?.length || 0} steps
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-grey-medium mt-1 line-clamp-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">Not Assigned</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {assignedExperiments.length === 0 && unassignedExperiments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Microscope size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No Experiments Found</h3>
            <p className="text-sm text-grey-medium mb-4">
              There are no experiments available in the system yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Experiment to Course"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Select Experiment
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
            >
              <option value="">Choose an experiment...</option>
              {unassignedExperiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} ({exp.subject} - {exp.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Select Course
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedModule('');
              }}
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Assign to Module (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={!selectedCourse}
            >
              <option value="">No specific module (course-level)</option>
              {courses
                .find((c) => c.id === selectedCourse)
                ?.modules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title} ({mod.contentType})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-grey-light">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedExperiment || !selectedCourse}
            >
              Assign Experiment
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
