import prisma from '@/lib/utils/prisma';
import { AITutorContext } from '@/lib/ai/gemini-tutor';

export class AITutorContextService {
  async buildContext(params: {
    studentId: string;
    subject?: string;
    courseId?: string;
    moduleId?: string;
    quizId?: string;
  }): Promise<AITutorContext> {
    const student = await prisma.student.findFirst({
      where: { id: params.studentId },
      select: {
        id: true,
        grade: true,
        examBoard: true,
        subjects: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const context: AITutorContext = {
      studentId: student.id,
      grade: student.grade,
      examBoard: student.examBoard,
      subjects: student.subjects,
      courseId: params.courseId,
      moduleId: params.moduleId,
      quizId: params.quizId,
    };

    if (params.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        select: { id: true, title: true, subject: true },
      });

      if (course) {
        context.courseTitle = course.title;
        if (!params.subject && course.subject) {
          context.subjects = [course.subject, ...student.subjects.filter((s) => s !== course.subject)];
        }
      }
    }

    if (params.moduleId) {
      const module = await prisma.courseModule.findUnique({
        where: { id: params.moduleId },
        select: { id: true, title: true },
      });

      if (module) {
        context.moduleTitle = module.title;
      }
    }

    if (params.quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: params.quizId },
        select: { id: true, title: true },
      });

      if (quiz) {
        context.quizTitle = quiz.title;
      }
    }

    const recentAttempt = await prisma.examAttempt.findFirst({
      where: { studentId: params.studentId },
      orderBy: { completedAt: 'desc' },
      select: { score: true, passed: true },
    });

    if (recentAttempt) {
      context.recentPerformance = {
        score: recentAttempt.score,
        passed: recentAttempt.passed,
      };
    }

    return context;
  }
}

export const aiTutorContextService = new AITutorContextService();
