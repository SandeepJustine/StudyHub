'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  description?: string;
  duration: number;
  xpReward: number;
  status: string;
  courseId?: string | null;
  moduleId?: string | null;
  course?: { id: string; title: string } | null;
  module?: { id: string; title: string } | null;
  _count: { attempts: number };
}

interface ExperimentAssignmentProps {
  courseId: string;
  instructorId: string;
}

export function ExperimentAssignment({ courseId, instructorId }: ExperimentAssignmentProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modules, setModules] = useState<Array<{ id: string; title: string; contentType: string }>>([]);

  useEffect(() => {
    fetchExperiments();
    fetchModules();
  }, [courseId]);

  const fetchExperiments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/instructor/experiments?courseId=${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch experiments');
      const data = await response.json();
      setExperiments(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch(`/api/courses/modules?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setModules(data.data || []);
      }
    } catch {
      // Modules fetch failed, continue without them
    }
  };

  const handleAssign = async () => {
    if (!selectedExperiment) {
      setToast({ message: 'Please select an experiment', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/instructor/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: selectedExperiment,
          courseId,
          moduleId: selectedModule || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign experiment');

      setToast({ message: 'Experiment assigned successfully', type: 'success' });
      setShowAssignModal(false);
      setSelectedExperiment('');
      setSelectedModule('');
      fetchExperiments();
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

      setToast({ message: 'Experiment unassigned', type: 'success' });
      fetchExperiments();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to unassign experiment', type: 'error' });
    }
  };

  const unassignedExperiments = experiments.filter(e => !e.courseId || e.courseId !== courseId);
  const assignedExperiments = experiments.filter(e => e.courseId === courseId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-grey-light/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-grey-dark">Failed to load experiments: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Microscope size={22} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Virtual Lab Experiments</h2>
            <p className="text-sm text-grey-medium">
              Assign existing experiments to this course or its modules
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)} leftIcon={<Plus size={16} />}>
          Assign Experiment
        </Button>
      </div>

      {/* Assigned Experiments */}
      {assignedExperiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assigned to This Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedExperiments.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FlaskConical size={18} className="text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-navy">{exp.title}</p>
                      <p className="text-xs text-grey-medium">
                        {exp.subject} • {exp.difficulty} • {exp.duration} min
                      </p>
                      {exp.module && (
                        <p className="text-xs text-grey-medium">Module: {exp.module.title}</p>
                      )}
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
            <CardTitle className="text-sm">Available Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedExperiments.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-grey-light/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FlaskConical size={18} className="text-grey-medium" />
                    <div>
                      <p className="text-sm font-medium text-navy">{exp.title}</p>
                      <p className="text-xs text-grey-medium">
                        {exp.subject} • {exp.difficulty} • {exp.duration} min
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">Not Assigned</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {assignedExperiments.length === 0 && unassignedExperiments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Microscope size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No Experiments Yet</h3>
            <p className="text-sm text-grey-medium mb-4">
              Assign existing Virtual Lab experiments to this course or its modules.
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
              Assign to Module (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy text-sm"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">No specific module (course-level)</option>
              {modules.map((mod) => (
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
            <Button variant="primary" onClick={handleAssign} disabled={!selectedExperiment}>
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