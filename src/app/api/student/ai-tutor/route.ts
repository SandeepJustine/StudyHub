import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { geminiTutorService } from '@/lib/ai/gemini-tutor';
import { aiTutorContextService } from '@/lib/ai/ai-tutor-context';
import { aiRateLimiter } from '@/lib/ai/rate-limiter';
import { RateLimitError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const rateLimit = aiRateLimiter.check(student.id);
    if (!rateLimit.allowed) {
      throw new RateLimitError(`Too many requests. Please try again in ${rateLimit.retryAfter} seconds`);
    }

    const body = await req.json();
    const { subject, question, previousMessages, conversationId, courseId, moduleId, quizId } = body;

    if (!subject || !question) {
      return NextResponse.json(
        { error: 'Subject and question are required' },
        { status: 400 }
      );
    }

    const context = await aiTutorContextService.buildContext({
      studentId: student.id,
      subject,
      courseId,
      moduleId,
      quizId,
    });

    const result = await geminiTutorService.getTutorResponse(session.user.id, context, {
      question,
      previousMessages: previousMessages || [],
      conversationId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      rateLimit: {
        remaining: rateLimit.remaining,
      },
    });
  } catch (error: any) {
    console.error('AI Tutor API error:', error);
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }
    if (error.message.includes('premium subscription')) {
      return NextResponse.json(
        { error: 'AI Tutor requires a premium subscription' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'AI Tutor is temporarily unavailable' },
      { status: 500 }
    );
  }
}
