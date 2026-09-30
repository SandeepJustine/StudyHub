'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ClipboardList, FlaskConical, ListChecks, Package, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GenericExperiment {
  id: string;
  title: string;
  subject: string;
  duration: string;
  difficulty: string;
  description: string;
  objectives: string[];
  materials: string[];
  procedure: string[];
  safetyNotes: string[];
  steps: { id: string; instruction: string; equipmentNeeded?: string[] }[];
}

/**
 * Fallback workbench for subjects without a dedicated simulator (e.g. Mathematics).
 * Renders the experiment briefing and lets the student work through it step by step.
 */
export const GenericLab: React.FC<{ experiment: GenericExperiment }> = ({ experiment }) => {
  const [done, setDone] = useState<string[]>([]);

  const steps: { id: string; instruction: string; equipmentNeeded?: string[] }[] =
    experiment.steps?.length
      ? experiment.steps
      : (experiment.procedure ?? []).map((instruction, i) => ({
          id: `step${i + 1}`,
          instruction,
        }));

  const toggle = (id: string) =>
    setDone((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );

  const progress = steps.length ? Math.round((done.length / steps.length) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto bg-grey-light p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <FlaskConical size={22} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-navy">{experiment.title}</h2>
                <p className="text-sm text-grey-medium">{experiment.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info" size="sm">{experiment.subject}</Badge>
                  <Badge variant="neutral" size="sm">{experiment.duration}</Badge>
                  <Badge variant="warning" size="sm">{experiment.difficulty}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2 bg-grey-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-navy shrink-0">
                {done.length}/{steps.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {experiment.objectives?.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-navy mb-3">
                <ListChecks size={16} /> Learning Objectives
              </h3>
              <ul className="space-y-1.5">
                {experiment.objectives.map((o, i) => (
                  <li key={i} className="flex gap-2 text-sm text-grey-dark">
                    <CheckCircle2 size={14} className="text-green shrink-0 mt-0.5" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {experiment.materials?.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-navy mb-3">
                <Package size={16} /> Materials
              </h3>
              <div className="flex flex-wrap gap-2">
                {experiment.materials.map((m, i) => (
                  <Badge key={i} variant="neutral" size="sm">{m}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-navy mb-3">
              <ClipboardList size={16} /> Procedure
            </h3>
            <ol className="space-y-2">
              {experiment.procedure?.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm text-grey-dark">
                  <span className="w-5 h-5 rounded-full bg-navy/10 text-navy text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {experiment.safetyNotes?.length > 0 && (
          <Card className="border-0 shadow-sm border-l-4 border-l-yellow-500">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-navy mb-3">
                <ShieldAlert size={16} className="text-yellow-600" /> Safety Notes
              </h3>
              <ul className="space-y-1.5">
                {experiment.safetyNotes.map((s, i) => (
                  <li key={i} className="text-sm text-grey-dark">• {s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-navy mb-3">Your Steps</h3>
            <ul className="space-y-2">
              {steps.map((step) => {
                const isDone = done.includes(step.id);
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      aria-pressed={isDone}
                      className={cn(
                        'w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        isDone ? 'bg-green-50 border-green/40' : 'bg-white border-grey-light hover:bg-grey-light/50'
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-green shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={18} className="text-grey-medium shrink-0 mt-0.5" />
                      )}
                      <span className="min-w-0">
                        <span className={cn('block text-sm', isDone ? 'text-navy line-through' : 'text-grey-dark')}>
                          {step.instruction}
                        </span>
                        {step.equipmentNeeded && step.equipmentNeeded.length > 0 && (
                          <span className="flex flex-wrap gap-1 mt-1.5">
                            {step.equipmentNeeded.map((e, i) => (
                              <Badge key={i} variant="neutral" size="sm">{e}</Badge>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {progress === 100 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green font-medium">
                Experiment complete. Well done!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenericLab;