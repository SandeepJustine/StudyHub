// Student quiz results page - shows auto-graded results after completing a quiz.
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { ExamResults } from '@/components/features/exam/exam-results';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ArrowLeft, Download, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { courseId, quizId } = await params;
  const { attempt: attemptId } = await searchParams;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <p>Student profile not found.</p>
      </div>
    );
  }

  // Get the exam attempt
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId || '' },
    include: {
      quiz: {
        include: {
          questions: true,
          module: {
            include: {
              course: {
                select: { title: true, subject: true },
              },
            },
          },
        },
      },
      certificate: true,
    },
  });

  if (!attempt || attempt.studentId !== student.id) {
    // If no specific attempt, get the latest attempt for this quiz
    const latestAttempt = await prisma.examAttempt.findFirst({
      where: {
        studentId: student.id,
        quizId,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        quiz: {
          include: {
            questions: true,
            module: {
              include: {
                course: {
                  select: { title: true, subject: true },
                },
              },
            },
          },
        },
        certificate: true,
      },
    });

    if (!latestAttempt) {
      return (
        <div className="min-h-screen bg-grey-light flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-navy mb-2">No Results Found</h2>
            <p className="text-grey-dark mb-4">You haven't taken this quiz yet.</p>
            <Link href={`/student/courses/${courseId}/learn`}>
              <Button variant="primary">Go to Course</Button>
            </Link>
          </div>
        </div>
      );
    }

    return renderResults(latestAttempt, courseId);
  }

  return renderResults(attempt, courseId);

  function renderResults(attempt: any, courseId: string) {
    const quiz = attempt.quiz;
    const questions = quiz.questions;
    const answers = attempt.answers as Record<string, any> || {};

    // Build question results
    const questionResults = questions.map((q: any) => {
      const studentAnswer = answers[q.id];
      let correct = false;
      let points = 0;

      if (q.type === 'MULTIPLE_CHOICE') {
        const correctOptions = (q.options || [])
          .filter((o: any) => o.isCorrect)
          .map((o: any) => o.text)
          .sort();
        const selectedOptions = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]).sort();
        correct = JSON.stringify(correctOptions) === JSON.stringify(selectedOptions);
      } else if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const correctOption = (q.options || []).find((o: any) => o.isCorrect);
        correct = studentAnswer === correctOption?.text;
      } else if (q.type === 'SHORT_ANSWER') {
        correct = studentAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
      }

      points = correct ? q.points : 0;

      return {
        questionId: q.id,
        questionText: q.text,
        correct,
        points,
        maxPoints: q.points,
        correctAnswer: q.correctAnswer || q.options?.filter((o: any) => o.isCorrect).map((o: any) => o.text),
        studentAnswer,
      };
    });

    const result = {
      score: attempt.score,
      totalPoints: quiz.totalPoints,
      earnedPoints: questionResults.reduce((sum: number, r: any) => sum + r.points, 0),
      percentage: attempt.score,
      passed: attempt.passed,
      passingScore: quiz.passingScore,
      timeSpent: attempt.timeSpent || 0,
      completedAt: attempt.completedAt || attempt.startedAt,
      questions: questionResults,
    };

    return (
      <div className="min-h-screen bg-grey-light py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/student/courses/${courseId}/learn`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-1" />
                Back to Course
              </Button>
            </Link>
          </div>

          {/* Results */}
          <ExamResults
            result={result}
            examTitle={quiz.title}
            courseTitle={quiz.module?.course?.title || 'Course'}
            subject={quiz.module?.course?.subject || 'Subject'}
            onRetry={() => {
              window.location.href = `/student/courses/${courseId}/learn?module=${quiz.moduleId}&quiz=${quiz.id}`;
            }}
            onReview={() => {
              // Scroll to question review
              window.location.href = `#question-review`;
            }}
            onViewCertificate={attempt.certificate ? () => {
              window.location.href = `/student/certificates/${attempt.certificate.id}`;
            } : undefined}
            onDownload={() => {
              window.print();
            }}
          />

          {/* Certificate Notice */}
          {attempt.passed && !attempt.certificate && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award size={24} className="text-green" />
                  <div>
                    <p className="font-medium text-green-800">Certificate Available!</p>
                    <p className="text-sm text-green-700">
                      You passed this quiz. A certificate will be generated for your achievement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Review */}
          <Card className="mt-6 border-0 shadow-sm" id="question-review">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Question Review</h3>
              <div className="space-y-4">
                {questionResults.map((q: any, index: number) => (
                  <div
                    key={q.questionId}
                    className={`border rounded-lg p-4 ${
                      q.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">Q{index + 1}</Badge>
                      <Badge variant={q.correct ? 'success' : 'error'}>
                        {q.correct ? 'Correct' : 'Incorrect'}
                      </Badge>
                      <Badge variant="neutral">{q.maxPoints} pt{q.maxPoints !== 1 ? 's' : ''}</Badge>
                    </div>
                    <p className="text-navy font-medium mb-2">{q.questionText}</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Your answer:</span>{' '}
                        {Array.isArray(q.studentAnswer)
                          ? q.studentAnswer.join(', ')
                          : q.studentAnswer || 'No answer'}
                      </p>
                      {!q.correct && (
                        <p>
                          <span className="font-medium text-green">Correct answer:</span>{' '}
                          {Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.join(', ')
                            : q.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
