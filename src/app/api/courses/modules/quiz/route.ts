// API route for quiz management.
// - POST: create a new quiz for a module
// - PUT: update an existing quiz
// - DELETE: delete a quiz

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { moduleId, title, description, timeLimit, passingScore, maxAttempts, shuffleQuestions, questions } = body;

    if (!moduleId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'moduleId, title, and at least one question are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    if (module.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if quiz already exists for this module
    const existingQuiz = await prisma.quiz.findUnique({
      where: { moduleId },
    });

    if (existingQuiz) {
      // Update existing quiz
      const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

      // Delete old questions
      await prisma.question.deleteMany({ where: { quizId: existingQuiz.id } });

      const updated = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title,
          description,
          timeLimit,
          passingScore: passingScore || 60,
          maxAttempts: maxAttempts || 3,
          shuffleQuestions: shuffleQuestions ?? true,
          questionsCount: questions.length,
          totalPoints,
          questions: {
            create: questions.map((q: any, index: number) => ({
              type: q.type || 'MULTIPLE_CHOICE',
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: q.points || 1,
              order: q.order ?? index,
            })),
          },
        },
        include: { questions: true },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Create new quiz
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    const quiz = await prisma.quiz.create({
      data: {
        moduleId,
        title,
        description,
        timeLimit,
        passingScore: passingScore || 60,
        maxAttempts: maxAttempts || 3,
        shuffleQuestions: shuffleQuestions ?? true,
        questionsCount: questions.length,
        totalPoints,
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: q.type || 'MULTIPLE_CHOICE',
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 1,
            order: q.order ?? index,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create quiz' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { quizId, title, description, timeLimit, passingScore, maxAttempts, shuffleQuestions, questions } = body;

    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }

    // Verify ownership
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: { include: { course: true } } },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (existingQuiz.module.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(timeLimit !== undefined && { timeLimit }),
      ...(passingScore !== undefined && { passingScore }),
      ...(maxAttempts !== undefined && { maxAttempts }),
      ...(shuffleQuestions !== undefined && { shuffleQuestions }),
    };

    if (questions !== undefined) {
      // Delete old questions and create new ones
      await prisma.question.deleteMany({ where: { quizId } });

      const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
      updateData.questionsCount = questions.length;
      updateData.totalPoints = totalPoints;
      updateData.questions = {
        create: questions.map((q: any, index: number) => ({
          type: q.type || 'MULTIPLE_CHOICE',
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points || 1,
          order: q.order ?? index,
        })),
      };
    }

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
      include: { questions: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }

    // Verify ownership
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: { include: { course: true } } },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (existingQuiz.module.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quiz' }, { status: 500 });
  }
}
