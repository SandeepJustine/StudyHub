'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Flag, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: Array<{ id: string; text: string }>;
  points: number;
}

interface QuestionViewProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string | string[];
  onAnswer: (questionId: string, answer: string | string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFlag: (questionId: string) => void;
  isFlagged?: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  onNext,
  onPrevious,
  onFlag,
  isFlagged,
  canGoNext,
  canGoPrevious,
}: QuestionViewProps) {
  const [shortAnswer, setShortAnswer] = useState('');

  const handleMultipleChoice = (optionId: string) => {
    if (question.type === 'MULTIPLE_CHOICE') {
      const current = (selectedAnswer as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      onAnswer(question.id, updated);
    } else {
      onAnswer(question.id, optionId);
    }
  };

  const handleShortAnswer = () => {
    onAnswer(question.id, shortAnswer);
  };

  return (
    <Card padding="lg" className="max-w-3xl mx-auto">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Badge variant="info">Question {questionNumber} of {totalQuestions}</Badge>
          <Badge variant="neutral">{question.points} pts</Badge>
          <Badge variant="neutral">{question.type.replace(/_/g, ' ')}</Badge>
        </div>
        <button
          onClick={() => onFlag(question.id)}
          className={`p-2 rounded-lg transition-colors ${
            isFlagged ? 'bg-yellow-100 text-yellow-600' : 'text-grey-medium hover:bg-grey-light'
          }`}
          title="Flag for review"
        >
          <Flag size={18} />
        </button>
      </div>

      {/* Question Text */}
      <div className="bg-grey-light/50 rounded-xl p-6 mb-6">
        <p className="text-lg text-navy font-medium leading-relaxed">{question.text}</p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {question.type === 'SHORT_ANSWER' ? (
          <div>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy focus:ring-2 focus:ring-navy/20 min-h-[120px]"
              placeholder="Type your answer here..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              onBlur={handleShortAnswer}
            />
          </div>
        ) : (
          question.options?.map((option) => {
            const isSelected = question.type === 'MULTIPLE_CHOICE'
              ? (selectedAnswer as string[])?.includes(option.id)
              : selectedAnswer === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleMultipleChoice(option.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-navy bg-navy/5 shadow-sm'
                    : 'border-grey-light hover:border-navy/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-navy bg-navy' : 'border-grey-medium'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`${isSelected ? 'text-navy font-medium' : 'text-grey-dark'}`}>
                    {option.text}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-grey-light">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          leftIcon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-grey-medium" />
          <span className="text-sm text-grey-medium">
            Select your answer and click Next
          </span>
        </div>

        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canGoNext}
          rightIcon={<ChevronRight size={16} />}
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next'}
        </Button>
      </div>
    </Card>
  );
}