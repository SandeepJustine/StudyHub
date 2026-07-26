import prisma from '@/lib/utils/prisma';

export class GradingService {
  /**
   * Get pending essay questions for grading (instructor)
   */
  async getPendingGrading(instructorId: string) {
    // Find courses by instructor
    const courses = await prisma.course.findMany({
      where: { instructorId },
      select: { id: true },
    });

    const courseIds = courses.map(c => c.id);

    // Find exam attempts with essay questions that need grading
    const attempts = await prisma.examAttempt.findMany({
      where: {
        completedAt: { not: null },
        quiz: {
          module: {
            courseId: { in: courseIds },
          },
          questions: {
            some: {
              type: 'ESSAY',
            },
          },
        },
      },
      include: {
        quiz: {
          include: {
            questions: {
              where: { type: 'ESSAY' },
            },
            module: {
              include: {
                course: {
                  select: { title: true },
                },
              },
            },
          },
        },
        student: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    // Filter attempts that have ungraded essays
    const pendingGrading = [];
    for (const attempt of attempts) {
      const answers = attempt.answers as Record<string, any> || {};
      for (const question of attempt.quiz.questions) {
        if (answers[question.id] && !answers[question.id].graded) {
          pendingGrading.push({
            attemptId: attempt.id,
            studentName: attempt.student.user.fullName,
            courseTitle: attempt.quiz.module.course.title,
            quizTitle: attempt.quiz.title,
            question,
            answer: answers[question.id],
            submittedAt: attempt.completedAt,
          });
        }
      }
    }

    return pendingGrading;
  }

  /**
   * Get student's grades summary
   */
  async getStudentGradesSummary(studentId: string) {
    const attempts = await prisma.examAttempt.findMany({
      where: { studentId },
      include: {
        quiz: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const coursesMap = new Map<string, any>();

    for (const attempt of attempts) {
      const courseId = attempt.quiz.module.courseId;
      if (!coursesMap.has(courseId)) {
        coursesMap.set(courseId, {
          courseId,
          courseTitle: attempt.quiz.module.course.title,
          subject: attempt.quiz.module.course.subject,
          quizzes: [],
          averageScore: 0,
          totalAttempts: 0,
          passedCount: 0,
        });
      }

      const courseData = coursesMap.get(courseId)!;
      courseData.quizzes.push({
        quizTitle: attempt.quiz.title,
        score: attempt.score,
        passed: attempt.passed,
        date: attempt.completedAt,
      });
      courseData.totalAttempts++;
      if (attempt.passed) courseData.passedCount++;
    }

    // Calculate averages
    for (const [_, data] of coursesMap) {
      data.averageScore = data.quizzes.reduce((sum: number, q: any) => sum + q.score, 0) / data.quizzes.length;
    }

    return Array.from(coursesMap.values());
  }
}

export const gradingService = new GradingService();