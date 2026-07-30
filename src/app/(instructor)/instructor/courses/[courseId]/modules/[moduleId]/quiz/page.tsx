'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Plus, Trash2, Edit, Save, ArrowLeft, HelpCircle, GripVertical, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id?: string;
  type: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  text: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  questionsCount: number;
  totalPoints: number;
  questions: Question[];
}

export default function QuizBuilderPage({ params }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    passingScore: 60,
    maxAttempts: 3,
    shuffleQuestions: true,
  });

  useEffect(() => {
    params.then(p => {
      setCourseId(p.courseId);
      setModuleId(p.moduleId);
    });
  }, [params]);

  useEffect(() => {
    if (moduleId) {
      loadQuiz();
    }
  }, [moduleId]);

  async function loadQuiz() {
    setIsLoading(true);
    try {
      // Fetch the module to check if it has a quiz
      const response = await fetch(`/api/courses/modules?courseId=${courseId}`);
      const data = await response.json();

      if (response.ok) {
        const module = data.data?.find((m: any) => m.id === moduleId);
        if (module?.quiz) {
          // Fetch quiz details with questions
          const quizResponse = await fetch(`/api/courses/modules/quiz?quizId=${module.quiz.id}`);
          const quizData = await quizResponse.json();
          if (quizResponse.ok && quizData.data) {
            const q = quizData.data;
            setQuiz({
              id: q.id,
              title: q.title,
              description: q.description || '',
              timeLimit: q.timeLimit,
              passingScore: q.passingScore,
              maxAttempts: q.maxAttempts,
              shuffleQuestions: q.shuffleQuestions,
              questionsCount: q.questionsCount,
              totalPoints: q.totalPoints,
              questions: q.questions.map((q: any) => ({
                id: q.id,
                type: q.type as any,
                text: q.text,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: q.points,
                order: q.order,
              })),
            });
            setQuizData({
              title: q.title,
              description: q.description || '',
              timeLimit: q.timeLimit || 30,
              passingScore: q.passingScore,
              maxAttempts: q.maxAttempts,
              shuffleQuestions: q.shuffleQuestions,
            });
          }
        } else {
          // No quiz yet, create empty state
          setQuiz(null);
          setQuizData({
            title: 'Quiz',
            description: '',
            timeLimit: 30,
            passingScore: 60,
            maxAttempts: 3,
            shuffleQuestions: true,
          });
        }
      } else {
        setError(data.error || 'Failed to load quiz');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  }

  const [questions, setQuestions] = useState<Question[]>([
    {
      type: 'MULTIPLE_CHOICE',
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      points: 1,
      order: 0,
    },
  ]);

  useEffect(() => {
    if (quiz) {
      setQuestions(quiz.questions);
    }
  }, [quiz]);

  const addQuestion = () => {
    const newQuestion: Question = {
      type: 'MULTIPLE_CHOICE',
      text: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      points: 1,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      setToast({ message: 'You need at least one question', type: 'error' });
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = value;
    setQuestions(newQuestions);
  };

  const toggleCorrect = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];

    if (question.type === 'MULTIPLE_CHOICE') {
      // Multiple selection
      question.options[oIndex].isCorrect = !question.options[oIndex].isCorrect;
    } else {
      // Single selection
      question.options.forEach((opt, i) => {
        opt.isCorrect = i === oIndex;
      });
    }
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: '', isCorrect: false });
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) {
      setToast({ message: 'Need at least 2 options', type: 'error' });
      return;
    }
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setToast({ message: `Question ${i + 1} is empty`, type: 'error' });
        return;
      }
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'SINGLE_CHOICE') {
        const hasCorrect = q.options.some(o => o.isCorrect);
        if (!hasCorrect) {
          setToast({ message: `Question ${i + 1} needs a correct answer`, type: 'error' });
          return;
        }
      }
      if (q.type === 'SHORT_ANSWER' && !q.correctAnswer) {
        setToast({ message: `Question ${i + 1} needs a correct answer`, type: 'error' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const body: any = {
        moduleId,
        title: quizData.title,
        description: quizData.description,
        timeLimit: quizData.timeLimit,
        passingScore: quizData.passingScore,
        maxAttempts: quizData.maxAttempts,
        shuffleQuestions: quizData.shuffleQuestions,
        questions: questions.map((q, i) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          options: q.type === 'MULTIPLE_CHOICE' || q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE'
            ? q.options
            : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          order: i,
        })),
      };

      const response = await fetch('/api/courses/modules/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: 'Quiz saved successfully!', type: 'success' });
        setQuiz(data.data);
        setTimeout(() => {
          router.push(`/instructor/courses/${courseId}/builder`);
        }, 1500);
      } else {
        setToast({ message: data.error || 'Failed to save quiz', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save quiz', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-grey-light/50 rounded w-1/3"></div>
          <div className="h-64 bg-grey-light/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/instructor/courses/${courseId}/builder`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Builder
          </Button>
        </Link>
        <div className="p-2.5 bg-purple-100 rounded-xl">
          <HelpCircle size={22} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Quiz Builder</h1>
          <p className="text-sm text-grey-medium">
            {quiz ? 'Edit your quiz' : 'Create a new quiz'} for this module
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Quiz Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Quiz Title"
            value={quizData.title}
            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-grey-dark mb-1.5">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-grey-light rounded-lg focus:border-navy min-h-[100px] text-sm"
              placeholder="Describe what this quiz covers..."
              value={quizData.description}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Time Limit (min)"
              type="number"
              value={quizData.timeLimit}
              onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Passing Score (%)"
              type="number"
              value={quizData.passingScore}
              onChange={(e) => setQuizData({ ...quizData, passingScore: parseInt(e.target.value) || 60 })}
            />
            <Input
              label="Max Attempts"
              type="number"
              value={quizData.maxAttempts}
              onChange={(e) => setQuizData({ ...quizData, maxAttempts: parseInt(e.target.value) || 3 })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quizData.shuffleQuestions}
              onChange={(e) => setQuizData({ ...quizData, shuffleQuestions: e.target.checked })}
            />
            <span className="text-sm text-grey-dark">Shuffle questions for each attempt</span>
          </label>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questions ({questions.length})</span>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus size={14} className="mr-1" />
              Add Question
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border border-grey-light rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="info">Q{qIndex + 1}</Badge>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                    className="text-sm border border-grey-light rounded px-2 py-1"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Multiple Answers)</option>
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay (Manual Grading)</option>
                  </select>
                  <Input
                    type="number"
                    label="Points"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)}>
                      <Trash2 size={14} className="text-red" />
                    </Button>
                  </div>
                </div>

                <Input
                  label="Question Text"
                  placeholder="Enter your question..."
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                />

                {(q.type === 'MULTIPLE_CHOICE' || q.type === 'SINGLE_CHOICE') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-grey-dark">
                      Options (click ✓ to mark correct)
                    </label>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCorrect(qIndex, oIndex)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            opt.isCorrect
                              ? 'border-navy bg-navy text-white'
                              : 'border-grey-medium'
                          }`}
                        >
                          {opt.isCorrect && <CheckCircle size={14} />}
                        </button>
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border-2 border-grey-light rounded-lg text-sm"
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt.text}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                        {q.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-1 text-red hover:bg-red-50 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addOption(qIndex)}>
                      <Plus size={12} className="mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}

                {q.type === 'TRUE_FALSE' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tf-${qIndex}`}
                        checked={q.options[0]?.isCorrect}
                        onChange={() => toggleCorrect(qIndex, 0)}
                      />
                      True
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tf-${qIndex}`}
                        checked={q.options[1]?.isCorrect}
                        onChange={() => toggleCorrect(qIndex, 1)}
                      />
                      False
                    </label>
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <Input
                    label="Correct Answer"
                    placeholder="Enter the correct answer (case-insensitive)"
                    value={q.correctAnswer || ''}
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                  />
                )}

                <Input
                  label="Explanation (optional)"
                  placeholder="Explain why this is the correct answer..."
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Link href={`/instructor/courses/${courseId}/builder`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          <Save size={16} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
