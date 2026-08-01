import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { examEngine } from '@/lib/exams/exam-engine';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const pendingItems = await prisma.examAttempt.findMany({
      where: {
        completedAt: { not: null },
        quiz: {
          module: {
            course: {
              instructorId: instructor.id,
            },
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

    const pendingGrading = [];
    for (const attempt of pendingItems) {
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

    return NextResponse.json({
      success: true,
      data: pendingGrading,
    });
  } catch (error: any) {
    console.error('Get pending grading error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch grading queue' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { attemptId, questionId, points, feedback } = body;

    if (!attemptId || !questionId || points === undefined) {
      return NextResponse.json(
        { error: 'attemptId, questionId, and points are required' },
        { status: 400 }
      );
    }

    // Verify the instructor owns the course
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
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
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.quiz.module.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await examEngine.gradeEssayQuestion(attemptId, questionId, points, feedback);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Grade essay error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
