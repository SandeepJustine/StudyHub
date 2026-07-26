'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ExamTimer } from '@/components/features/exam/exam-timer';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [examStarted, setExamStarted] = useState(false);

  // Fetch available exams
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const response = await fetch('/api/exams/available');
    const data = await response.json();
    setExams(data.data);
  };

  const startExam = async (examId: string) => {
    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: examId }),
    });
    const data = await response.json();
    setActiveExam(data.data);
    setExamStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowExamModal(true);
  };

  const submitAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const submitExam = async () => {
    const response = await fetch(`/api/exams/${activeExam.attempt.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    setActiveExam({ ...activeExam, result: data.data });
    setExamStarted(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Mock Examinations</h1>
        <Badge variant="info">3 Attempts Remaining</Badge>
      </div>

      {/* Available Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { subject: 'Mathematics', questions: 50, time: 180, board: 'MSCE' },
          { subject: 'English', questions: 40, time: 150, board: 'MSCE' },
          { subject: 'Physics', questions: 45, time: 180, board: 'MSCE' },
          { subject: 'Biology', questions: 40, time: 150, board: 'MSCE' },
          { subject: 'Chemistry', questions: 45, time: 180, board: 'MSCE' },
          { subject: 'Geography', questions: 35, time: 120, board: 'MSCE' },
        ].map((exam, i) => (
          <Card key={i} hover padding="lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-navy">{exam.subject}</h3>
                <p className="text-sm text-grey-medium">{exam.board} Examination</p>
              </div>
              <Badge variant="neutral">{exam.time} mins</Badge>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Questions</span>
                <span className="font-medium">{exam.questions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-medium">Passing Score</span>
                <span className="font-medium">60%</span>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={() => startExam(`exam-${i}`)}>
              Start Exam
            </Button>
          </Card>
        ))}
      </div>

      {/* Exam Modal */}
      <Modal
        isOpen={showExamModal}
        onClose={() => {
          if (!examStarted) setShowExamModal(false);
        }}
        size="full"
        title={activeExam?.quiz?.title || 'Examination'}
        showCloseButton={!examStarted}
      >
        {examStarted && activeExam?.questions ? (
          <div className="flex flex-col h-full">
            {/* Exam Header */}
            <div className="flex items-center justify-between mb-6">
              <ExamTimer
                duration={activeExam.timeLimit || 180}
                onTimeUp={submitExam}
                isRunning={examStarted}
              />
              <div className="flex items-center gap-4 text-sm">
                <span className="text-grey-dark">
                  Question {currentQuestion + 1} of {activeExam.questions.length}
                </span>
                <Badge variant="info">
                  {Object.keys(answers).length} Answered
                </Badge>
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto">
              <div className="bg-grey-light/50 rounded-xl p-6 mb-6">
                <p className="text-lg font-medium text-navy mb-4">
                  {activeExam.questions[currentQuestion]?.text}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {activeExam.questions[currentQuestion]?.options?.map((option: any, i: number) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[activeExam.questions[currentQuestion].id] === option.text
                          ? 'border-navy bg-navy/5'
                          : 'border-grey-light hover:border-navy/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        checked={answers[activeExam.questions[currentQuestion].id] === option.text}
                        onChange={() => submitAnswer(activeExam.questions[currentQuestion].id, option.text)}
                        className="text-navy"
                      />
                      <span className="text-grey-dark">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-grey-light">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {activeExam.questions.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      i === currentQuestion
                        ? 'bg-navy text-white'
                        : answers[activeExam.questions[i]?.id]
                        ? 'bg-green text-white'
                        : 'bg-grey-light text-grey-dark hover:bg-grey-medium'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === activeExam.questions.length - 1 ? (
                <Button variant="primary" onClick={submitExam}>
                  Submit Exam
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setCurrentQuestion(Math.min(activeExam.questions.length - 1, currentQuestion + 1))}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        ) : activeExam?.result ? (
          /* Exam Results */
          <div className="text-center py-8">
            {activeExam.result.passed ? (
              <CheckCircle size={64} className="mx-auto text-green mb-4" />
            ) : (
              <XCircle size={64} className="mx-auto text-red mb-4" />
            )}
            <h2 className="text-2xl font-bold text-navy mb-2">
              {activeExam.result.passed ? 'Congratulations!' : 'Keep Practicing'}
            </h2>
            <p className="text-grey-dark mb-6">
              You scored {activeExam.result.percentage}%
              {activeExam.result.passed && ' - You passed!'}
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setShowExamModal(false)}>
                Close
              </Button>
              {!activeExam.result.passed && (
                <Button variant="primary">Retry Exam</Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}