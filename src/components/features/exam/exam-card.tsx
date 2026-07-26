import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Award, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

interface ExamCardProps {
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
  onStart: (examId: string) => void;
  onViewResults?: (examId: string) => void;
}

export function ExamCard({
  id,
  title,
  subject,
  examBoard,
  questionsCount,
  duration,
  passingScore,
  attemptsCount,
  maxAttempts,
  lastScore,
  lastAttemptDate,
  isAvailable,
  onStart,
  onViewResults,
}: ExamCardProps) {
  const attemptsLeft = maxAttempts - attemptsCount;
  const canAttempt = isAvailable && attemptsLeft > 0;

  return (
    <Card padding="lg" className="hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" size="sm">{subject}</Badge>
            <Badge variant="neutral" size="sm">{examBoard}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-navy">{title}</h3>
        </div>
        {lastScore !== undefined && (
          <div className={`text-center p-2 rounded-lg ${
            lastScore >= passingScore ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <p className={`text-lg font-bold ${
              lastScore >= passingScore ? 'text-green' : 'text-red'
            }`}>
              {lastScore}%
            </p>
            <p className="text-xs text-grey-medium">Last Score</p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-grey-dark">
          <FileText size={16} className="text-grey-medium" />
          <span>{questionsCount} Questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-grey-dark">
          <Clock size={16} className="text-grey-medium" />
          <span>{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-grey-dark">
          <Award size={16} className="text-grey-medium" />
          <span>Pass: {passingScore}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-grey-dark">
          <TrendingUp size={16} className="text-grey-medium" />
          <span>{attemptsCount}/{maxAttempts} Attempts</span>
        </div>
      </div>

      {/* Last Attempt Info */}
      {lastAttemptDate && (
        <div className="flex items-center gap-2 text-xs text-grey-medium mb-4">
          <Calendar size={14} />
          <span>Last attempt: {new Date(lastAttemptDate).toLocaleDateString()}</span>
        </div>
      )}

      {/* Attempts Warning */}
      {!canAttempt && attemptsLeft <= 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4 text-sm text-red-800">
          <AlertCircle size={16} />
          <span>Maximum attempts reached ({maxAttempts}/{maxAttempts})</span>
        </div>
      )}

      {canAttempt && attemptsLeft <= 2 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-4 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>{attemptsLeft} attempt{attemptsLeft > 1 ? 's' : ''} remaining</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          fullWidth
          disabled={!canAttempt}
          onClick={() => onStart(id)}
        >
          {attemptsCount === 0 ? 'Start Exam' : 'Retake Exam'}
        </Button>
        {lastScore !== undefined && onViewResults && (
          <Button
            variant="outline"
            onClick={() => onViewResults(id)}
          >
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
}