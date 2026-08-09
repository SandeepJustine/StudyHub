import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { QuestionType } from '@/types/course';

export class ExamEngine {
  /**
   * Start a new exam attempt
   */
  async startExam(studentId: string, quizId: string) {
    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { studentId },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            text: true,
            options: true,
            points: true,
            order: true,
            // Exclude correctAnswer and explanation for exam
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) throw new NotFoundError('Quiz');

    // Verify enrollment
    const isEnrolled = quiz.module.course.enrollments.length > 0;
    if (!isEnrolled) {
      throw new AppError('Must be enrolled in the course to take this exam', 'NOT_ENROLLED', 403);
    }

    // Check attempt limit
    const attemptsCount = await prisma.examAttempt.count({
      where: { studentId, quizId },
    });

    if (attemptsCount >= quiz.maxAttempts) {
      throw new AppError(
        `Maximum attempts (${quiz.maxAttempts}) reached`,
        'MAX_ATTEMPTS_REACHED',
        400
      );
    }

    // Shuffle questions if enabled
    let questions = quiz.questions;
    if (quiz.shuffleQuestions) {
      questions = this.shuffleArray([...questions]);
    }

    // Create attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        studentId,
        quizId,
        score: 0,
        passed: false,
        startedAt: new Date(),
      },
    });

    return {
      attempt,
      questions,
      timeLimit: quiz.timeLimit,
      totalQuestions: questions.length,
      totalPoints: quiz.totalPoints,
      passingScore: quiz.passingScore,
    };
  }

  /**
   * Submit exam answers
   */
  async submitExam(
    attemptId: string,
    studentId: string,
    answers: Record<string, any>
  ) {
    // Get attempt with quiz and questions
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundError('Exam attempt');
    if (attempt.studentId !== studentId) {
      throw new AppError('Not your exam attempt', 'FORBIDDEN', 403);
    }
    if (attempt.completedAt) {
      throw new AppError('Exam already submitted', 'ALREADY_SUBMITTED', 400);
    }

    // Auto-grade objective questions, flag essay questions for review
    const gradingResult = this.gradeExam(attempt.quiz.questions, answers);

    // Check if there are essay questions that need instructor review
    const hasEssayQuestions = attempt.quiz.questions.some((q: any) => q.type === 'ESSAY');
    const autoScore = hasEssayQuestions ? gradingResult.autoScore : gradingResult.percentage;
    const autoPassed = hasEssayQuestions ? false : gradingResult.passed; // Require instructor review for mixed exams

    // Update attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: autoScore,
        passed: autoPassed,
        completedAt: new Date(),
        answers: JSON.stringify({
          ...answers,
          _meta: {
            hasEssayQuestions,
            autoScore,
            autoPassed,
            pendingReview: hasEssayQuestions,
          },
        }),
      },
    });

    // Generate certificate only if fully passed (no pending essays) or auto-passed
    let certificate = null;
    if (!hasEssayQuestions && gradingResult.passed) {
      certificate = await this.generateExamCertificate(
        studentId,
        updatedAttempt.id
      );
    }

    return {
      attempt: updatedAttempt,
      result: {
        ...gradingResult,
        score: autoScore,
        passed: autoPassed,
        pendingReview: hasEssayQuestions,
      },
      certificate,
    };
  }

  /**
   * Grade exam answers
   */
  private gradeExam(
    questions: any[],
    answers: Record<string, any>
  ) {
    let totalPoints = 0;
    let earnedPoints = 0;
    let autoEarnedPoints = 0;
    const details: any[] = [];

    for (const question of questions) {
      const studentAnswer = answers[question.id];
      const result = this.gradeQuestion(question, studentAnswer);
      
      totalPoints += question.points;
      earnedPoints += result.points;
      
      if (question.type !== 'ESSAY') {
        autoEarnedPoints += result.points;
      }
      
      details.push({
        questionId: question.id,
        type: question.type,
        correct: result.correct,
        points: result.points,
        maxPoints: question.points,
        correctAnswer: question.correctAnswer || question.options?.filter((o: any) => o.isCorrect).map((o: any) => o.text),
        studentAnswer,
        pendingReview: question.type === 'ESSAY',
      });
    }

    const autoPercentage = totalPoints > 0 ? (autoEarnedPoints / totalPoints) * 100 : 0;
    const totalPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      earnedPoints,
      totalPoints,
      autoScore: Math.round(autoPercentage * 100) / 100,
      percentage: Math.round(totalPercentage * 100) / 100,
      passed: totalPercentage >= (questions[0]?.quiz?.passingScore || 60),
      passingScore: questions[0]?.quiz?.passingScore || 60,
      details,
    };
  }

  /**
   * Grade individual question
   */
  private gradeQuestion(question: any, studentAnswer: any): { correct: boolean; points: number; pendingReview?: boolean } {
    switch (question.type) {
      case 'MULTIPLE_CHOICE': {
        const correctOptions = (question.options as any[])
          .filter((o: any) => o.isCorrect)
          .map((o: any) => o.text)
          .sort();
        const selectedOptions = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]).sort();
        const correct = JSON.stringify(correctOptions) === JSON.stringify(selectedOptions);
        return { correct, points: correct ? question.points : 0 };
      }

      case 'SINGLE_CHOICE': {
        const correctOption = (question.options as any[]).find((o: any) => o.isCorrect);
        const correct = studentAnswer === correctOption?.text;
        return { correct, points: correct ? question.points : 0 };
      }

      case 'TRUE_FALSE': {
        const correctOption = (question.options as any[]).find((o: any) => o.isCorrect);
        const correct = studentAnswer === correctOption?.text;
        return { correct, points: correct ? question.points : 0 };
      }

      case 'SHORT_ANSWER': {
        // Case-insensitive comparison for short answers
        const correct = studentAnswer?.toLowerCase().trim() === 
                       question.correctAnswer?.toLowerCase().trim();
        return { correct, points: correct ? question.points : 0 };
      }

      case 'ESSAY': {
        // Essays require manual grading - return 0 points but mark as pending review
        return { correct: false, points: 0, pendingReview: true };
      }

      default:
        return { correct: false, points: 0 };
    }
  }

  /**
   * Manual grading for essay questions (instructor)
   */
  async gradeEssayQuestion(
    attemptId: string,
    questionId: string,
    points: number,
    feedback?: string
  ) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { certificate: true },
    });

    if (!attempt) throw new NotFoundError('Exam attempt');
    if (!attempt.answers) throw new AppError('No answers to grade', 'NO_ANSWERS', 400);

    // Update the specific question's score
    const answers = attempt.answers as Record<string, any>;
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new NotFoundError('Question');

    // Recalculate total score
    const allQuestions = await prisma.question.findMany({
      where: { quizId: attempt.quizId },
    });

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of allQuestions) {
      totalPoints += q.points;
      if (q.id === questionId) {
        earnedPoints += points;
      } else if (answers[q.id] !== undefined && q.type !== 'ESSAY') {
        // Auto-graded questions keep their original score
        const result = this.gradeQuestion(q, answers[q.id]);
        earnedPoints += result.points;
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= (attempt as any).quiz?.passingScore;

    // Update attempt
    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: percentage,
        passed,
        answers: {
          ...answers,
          [questionId]: {
            answer: answers[questionId],
            score: points,
            feedback,
            graded: true,
          },
        },
      },
    });

    // Generate certificate if now passed
    let certificate = null;
    if (passed && !attempt.certificate) {
      certificate = await this.generateExamCertificate(
        attempt.studentId,
        attemptId
      );
    }

    return { attempt: updated, certificate };
  }

  /**
   * Generate certificate for passed exam
   */
  private async generateExamCertificate(studentId: string, examAttemptId: string) {
    const verificationId = this.generateVerificationId();
    const certificateNumber = `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const defaultTemplate = await prisma.certificateTemplate.findFirst({
      where: { isDefault: true, isActive: true },
    });

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId,
        examAttemptId,
        templateId: defaultTemplate?.id || 'default',
        type: 'DIGITAL',
        delivery: 'DIGITAL',
        title: 'Certificate of Achievement',
        description: 'Successfully completed the examination',
        verificationId,
        issuedAt: new Date(),
        paymentStatus: 'FREE',
        amount: 0,
        metadata: {
          issuer: 'StudyHub Malawi',
          generatedAt: new Date().toISOString(),
        },
      },
    });

    return certificate;
  }

  /**
   * Get exam history for student
   */
  async getStudentExamHistory(studentId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10 } = params || {};

    const [attempts, total] = await Promise.all([
      prisma.examAttempt.findMany({
        where: { studentId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          quiz: {
            select: {
              title: true,
              module: {
                select: {
                  course: {
                    select: { title: true, subject: true },
                  },
                },
              },
            },
          },
          certificate: {
            select: {
              id: true,
              verificationId: true,
              type: true,
            },
          },
        },
      }),
      prisma.examAttempt.count({ where: { studentId } }),
    ]);

    return {
      attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get exam results for analytics
   */
  async getExamAnalytics(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) throw new NotFoundError('Quiz');

    const attempts = await prisma.examAttempt.findMany({
      where: { quizId },
      select: {
        score: true,
        passed: true,
      },
    });
    const averageScore = attempts.length > 0
      ? attempts.reduce((sum: number, a: any) => sum + a.score, 0) / attempts.length
      : 0;
    const passRate = attempts.length > 0
      ? (attempts.filter((a: any) => a.passed).length / attempts.length) * 100
      : 0;

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      passingScore: quiz.passingScore,
    };
  }

  /**
   * Generate unique verification ID
   */
  private generateVerificationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `SH-CERT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const examEngine = new ExamEngine();