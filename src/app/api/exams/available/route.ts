import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const courseId = searchParams.get('courseId');

    // Build where clause based on enrollment
    const where: any = {
      module: {
        course: {
          enrollments: {
            some: {
              student: { userId: session.user.id },
            },
          },
        },
      },
    };

    if (subject) {
      where.module.course.subject = subject;
    }

    if (courseId) {
      where.module.courseId = courseId;
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        module: {
          select: {
            title: true,
            course: {
              select: { title: true, subject: true, id: true },
            },
          },
        },
        questions: { select: { id: true } },
        _count: {
          select: { examAttempts: true },
        },
      },
    });

    // Get completed quiz IDs
    const completedAttempts = await prisma.examAttempt.findMany({
      where: { studentId: session.user.id },
      select: { quizId: true },
    });

    const completedQuizIds = new Set(completedAttempts.map(a => a.quizId));

    const availableQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      totalPoints: quiz.totalPoints,
      isAvailable: !completedQuizIds.has(quiz.id),
      course: quiz.module.course,
      module: quiz.module,
      questionCount: quiz.questions.length,
      attemptCount: quiz._count.examAttempts,
    }));

    return NextResponse.json({
      success: true,
      data: availableQuizzes,
    });
  } catch (error: any) {
    console.error('Get available exams error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
