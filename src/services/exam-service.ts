import { prisma } from '@/lib/prisma';
import { ExamResult, Question, Exam } from '@/types/exam';

export class ExamService {
  static async createExam(data: {
    title: string;
    description: string;
    subjectId: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    questions: Question[];
    createdBy: string;
  }): Promise<Exam> {
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        duration: data.duration,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        createdBy: data.createdBy,
        questions: {
          create: data.questions.map((question) => ({
            text: question.text,
            type: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            marks: question.marks,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return exam as Exam;
  }

  static async getExamById(id: string): Promise<Exam | null> {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    return exam as Exam | null;
  }

  static async getExamsBySubject(subjectId: string): Promise<Exam[]> {
    const exams = await prisma.exam.findMany({
      where: { subjectId },
      include: {
        questions: true,
      },
    });

    return exams as Exam[];
  }

  static async submitExamAttempt(data: {
    examId: string;
    userId: string;
    answers: Record<string, string>;
  }): Promise<ExamResult> {
    const exam = await this.getExamById(data.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Calculate score
    let obtainedMarks = 0;
    const answers = data.answers;

    exam.questions.forEach((question) => {
      const questionId = question.id;
      const userAnswer = answers[questionId];
      
      if (userAnswer === question.correctAnswer) {
        obtainedMarks += question.marks;
      }
    });

    const percentage = (obtainedMarks / exam.totalMarks) * 100;
    const passed = percentage >= (exam.passingMarks / exam.totalMarks) * 100;

    // Save exam attempt
    const examAttempt = await prisma.examAttempt.create({
      data: {
        examId: data.examId,
        userId: data.userId,
        answers: answers,
        obtainedMarks,
        percentage,
        passed,
        completedAt: new Date(),
      },
    });

    // Generate certificate if passed
    let certificateId = null;
    if (passed) {
      const certificate = await prisma.certificate.create({
        data: {
          userId: data.userId,
          examId: data.examId,
          type: 'EXAM',
          verificationId: this.generateVerificationId(),
          issuedAt: new Date(),
        },
      });
      certificateId = certificate.id;
    }

    return {
      id: examAttempt.id,
      examId: data.examId,
      userId: data.userId,
      obtainedMarks,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      certificateId,
      completedAt: examAttempt.completedAt,
    };
  }

  static async getExamResults(userId: string): Promise<ExamResult[]> {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId },
      include: {
        exam: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      examId: attempt.examId,
      userId: attempt.userId,
      obtainedMarks: attempt.obtainedMarks,
      totalMarks: attempt.exam.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      certificateId: attempt.certificateId,
      completedAt: attempt.completedAt,
    }));
  }

  static async verifyCertificate(verificationId: string): Promise<any> {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        user: true,
        exam: true,
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    return {
      id: certificate.id,
      userId: certificate.userId,
      userName: certificate.user.name,
      examId: certificate.examId,
      examTitle: certificate.exam.title,
      type: certificate.type,
      verificationId: certificate.verificationId,
      issuedAt: certificate.issuedAt,
    };
  }

  private static generateVerificationId(): string {
    // Generate a unique verification ID for certificates
    return `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
}
