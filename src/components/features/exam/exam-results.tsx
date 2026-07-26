'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Download,
  Share2,
  RotateCcw,
  Eye,
  Target,
  BarChart3,
  FileText,
} from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

interface QuestionResult {
  questionId: string;
  questionText: string;
  correct: boolean;
  points: number;
  maxPoints: number;
  correctAnswer?: string;
  studentAnswer?: string;
}

interface ExamResult {
  score: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  timeSpent: number;
  completedAt: Date;
  certificateUrl?: string;
  questions: QuestionResult[];
}

interface ExamResultsProps {
  result: ExamResult;
  examTitle: string;
  courseTitle: string;
  subject: string;
  onRetry?: () => void;
  onReview?: () => void;
  onViewCertificate?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function ExamResults({
  result,
  examTitle,
  courseTitle,
  subject,
  onRetry,
  onReview,
  onViewCertificate,
  onShare,
  onDownload,
}: ExamResultsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const correctCount = result.questions.filter(q => q.correct).length;
  const incorrectCount = result.questions.length - correctCount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Result Header */}
      <Card padding="lg" className="text-center">
        {/* Icon */}
        <div className="mb-6">
          {result.passed ? (
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Award size={48} className="text-green" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Target size={48} className="text-red" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-navy mb-2">
          {result.passed ? 'Congratulations! You Passed!' : 'Keep Practicing!'}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="info">{subject}</Badge>
          <Badge variant="neutral">{courseTitle}</Badge>
        </div>
        <p className="text-grey-dark">{examTitle}</p>

        {/* Score */}
        <div className="bg-navy/5 rounded-xl p-6 my-6">
          <div className="text-6xl font-bold text-navy mb-2">
            {result.percentage.toFixed(1)}%
          </div>
          <p className="text-grey-medium">
            {result.earnedPoints} out of {result.totalPoints} points
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant={result.passed ? 'success' : 'error'}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </Badge>
            <Badge variant="neutral">
              Passing: {result.passingScore}%
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-grey-light/50 rounded-lg">
            <CheckCircle size={20} className="mx-auto text-green mb-1" />
            <p className="text-xs text-grey-medium">Correct</p>
            <p className="font-bold text-green">{correctCount}</p>
          </div>
          <div className="p-4 bg-grey-light/50 rounded-lg">
            <XCircle size={20} className="mx-auto text-red mb-1" />
            <p className="text-xs text-grey-medium">Incorrect</p>
            <p className="font-bold text-red">{incorrectCount}</p>
          </div>
          <div className="p-4 bg-grey-light/50 rounded-lg">
            <Clock size={20} className="mx-auto text-grey-medium mb-1" />
            <p className="text-xs text-grey-medium">Time Spent</p>
            <p className="font-bold text-navy">{formatTime(result.timeSpent)}</p>
          </div>
          <div className="p-4 bg-grey-light/50 rounded-lg">
            <BarChart3 size={20} className="mx-auto text-grey-medium mb-1" />
            <p className="text-xs text-grey-medium">Accuracy</p>
            <p className="font-bold text-navy">
              {((correctCount / result.questions.length) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {onReview && (
          <Button variant="outline" leftIcon={<Eye size={16} />} onClick={onReview}>
            Review Answers
          </Button>
        )}
        
        {!result.passed && onRetry && (
          <Button variant="primary" leftIcon={<RotateCcw size={16} />} onClick={onRetry}>
            Retry Exam
          </Button>
        )}

        {result.passed && onViewCertificate && (
          <Button variant="success" leftIcon={<Award size={16} />} onClick={onViewCertificate}>
            View Certificate
          </Button>
        )}

        {onDownload && (
          <Button variant="outline" leftIcon={<Download size={16} />} onClick={onDownload}>
            Download Results
          </Button>
        )}

        {onShare && (
          <Button variant="outline" leftIcon={<Share2 size={16} />} onClick={onShare}>
            Share
          </Button>
        )}
      </div>

      {/* Certificate Notice */}
      {result.passed && !result.certificateUrl && (
        <Card padding="md" className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Award size={24} className="text-green" />
            <div>
              <p className="font-medium text-green-800">Certificate Available!</p>
              <p className="text-sm text-green-700">
                You can now view, download, or share your certificate of achievement.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}