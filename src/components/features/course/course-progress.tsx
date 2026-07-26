import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, CheckCircle, Play, FileText, Award } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

interface ModuleProgress {
  id: string;
  title: string;
  type: 'VIDEO' | 'AUDIO' | 'TEXT' | 'QUIZ' | 'PDF';
  duration?: number;
  completed: boolean;
  score?: number;
}

interface CourseProgressProps {
  courseTitle: string;
  courseSubject: string;
  overallProgress: number;
  modulesCompleted: number;
  totalModules: number;
  timeSpent: number;
  modules: ModuleProgress[];
  onContinue: (moduleId: string) => void;
  onViewCertificate?: () => void;
  certificateEarned?: boolean;
}

export function CourseProgress({
  courseTitle,
  courseSubject,
  overallProgress,
  modulesCompleted,
  totalModules,
  timeSpent,
  modules,
  onContinue,
  onViewCertificate,
  certificateEarned,
}: CourseProgressProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    VIDEO: <Play size={16} />,
    AUDIO: <Play size={16} />,
    TEXT: <FileText size={16} />,
    QUIZ: <FileText size={16} />,
    PDF: <FileText size={16} />,
  };

  return (
    <Card padding="lg">
      {/* Course Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Badge variant="info" size="sm" className="mb-2">{courseSubject}</Badge>
          <h2 className="text-xl font-bold text-navy">{courseTitle}</h2>
        </div>
        {certificateEarned && onViewCertificate && (
          <Button variant="success" size="sm" leftIcon={<Award size={16} />} onClick={onViewCertificate}>
            View Certificate
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-navy/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-grey-medium">Overall Progress</p>
            <p className="text-3xl font-bold text-navy">{Math.round(overallProgress)}%</p>
          </div>
          <div className="text-right text-sm text-grey-medium">
            <p>{modulesCompleted} of {totalModules} modules completed</p>
            <p className="flex items-center gap-1 justify-end mt-1">
              <Clock size={14} />
              {formatDuration(timeSpent)} spent
            </p>
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Module List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-navy mb-3">Course Content</h3>
        {modules.map((module, index) => (
          <button
            key={module.id}
            onClick={() => onContinue(module.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
              module.completed
                ? 'bg-green-50 hover:bg-green-100'
                : 'bg-grey-light/50 hover:bg-grey-light'
            }`}
          >
            {/* Module Number */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              module.completed
                ? 'bg-green text-white'
                : 'bg-navy/10 text-navy'
            }`}>
              {module.completed ? (
                <CheckCircle size={16} />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Module Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${module.completed ? 'text-green-800' : 'text-navy'}`}>
                  {module.title}
                </p>
                <Badge size="sm" variant={module.completed ? 'success' : 'neutral'}>
                  {module.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-grey-medium">
                <span className="flex items-center gap-1">
                  {typeIcons[module.type]}
                  {module.type}
                </span>
                {module.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(module.duration)}
                  </span>
                )}
                {module.score !== undefined && (
                  <span>Score: {module.score}%</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {module.completed ? (
                <CheckCircle size={20} className="text-green" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-grey-medium" />
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}