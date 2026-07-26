'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuestionView } from './question-view';
import { ExamTimer } from './exam-timer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { 
  Clock, 
  Flag, 
  AlertTriangle, 
  CheckCircle,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: Array<{ id: string; text: string }>;
  points: number;
}

interface ExamTakingProps {
  examId: string;
  examTitle: string;
  questions: Question[];
  duration: number; // minutes
  passingScore: number;
  onTimeUp: () => void;
  onSubmit: (answers: Record<string, any>) => void;
  onSaveProgress?: (answers: Record<string, any>) => void;
}

export function ExamTaking({
  examId,
  examTitle,
  questions,
  duration,
  passingScore,
  onTimeUp,
  onSubmit,
  onSaveProgress,
}: ExamTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = questions.length - answeredCount;

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
      setShowQuestionGrid(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (error) {
      setToast({ message: 'Failed to submit exam', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    setToast({ message: 'Time is up! Your exam will be submitted automatically.', type: 'error' });
    setTimeout(() => {
      onSubmit(answers);
    }, 2000);
    onTimeUp();
  }, [answers, onSubmit, onTimeUp]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (!onSaveProgress) return;
    const interval = setInterval(() => {
      onSaveProgress(answers);
    }, 60000);
    return () => clearInterval(interval);
  }, [answers, onSaveProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentQuestion]);

  const question = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Exam Header */}
      <Card padding="md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Timer */}
          <ExamTimer
            duration={duration}
            onTimeUp={handleTimeUp}
            isRunning={true}
          />

          {/* Stats */}
          <div className="flex items-center gap-4">
            <Badge variant="success">
              <CheckCircle size={14} className="mr-1" />
              {answeredCount} Answered
            </Badge>
            <Badge variant="warning">
              <Flag size={14} className="mr-1" />
              {flaggedCount} Flagged
            </Badge>
            {unansweredCount > 0 && (
              <Badge variant="error">
                <AlertTriangle size={14} className="mr-1" />
                {unansweredCount} Unanswered
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Grid3X3 size={16} />}
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
            >
              Questions
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={16} />}
              onClick={() => setShowSubmitModal(true)}
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Question Grid (Expandable) */}
        {showQuestionGrid && (
          <div className="mt-4 pt-4 border-t border-grey-light">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    index === currentQuestion
                      ? 'bg-navy text-white'
                      : answers[q.id]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : flaggedQuestions.has(q.id)
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-grey-light text-grey-dark hover:bg-grey-medium/30'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Question View */}
      {question && (
        <QuestionView
          question={question}
          questionNumber={currentQuestion + 1}
          totalQuestions={questions.length}
          selectedAnswer={answers[question.id]}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onFlag={handleFlag}
          isFlagged={flaggedQuestions.has(question.id)}
          canGoNext={currentQuestion < questions.length - 1}
          canGoPrevious={currentQuestion > 0}
        />
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Exam"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Are you sure you want to submit your exam?
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Answered: {answeredCount} of {questions.length}</li>
              <li>• Flagged for review: {flaggedCount}</li>
              {unansweredCount > 0 && (
                <li className="text-red-600">
                  • Unanswered: {unansweredCount} questions
                </li>
              )}
            </ul>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-red">
              <AlertTriangle size={16} />
              <span>You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.</span>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Continue Exam
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              Submit Exam
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}