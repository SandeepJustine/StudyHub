import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/live-classes
 * List the authenticated instructor's live classes.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const where: any = { instructorId: instructor.id };
    if (status) where.status = status;

    const classes = await prisma.liveClass.findMany({
      where,
      include: { course: { select: { title: true, subject: true } } },
      orderBy: { scheduledAt: status === 'ended' ? 'desc' : 'asc' },
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    console.error('Instructor live-classes list error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/live-classes
 * Schedule a new live class.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const body = await req.json();
    const { title, description, subject, scheduledAt, duration, maxParticipants, courseId, meetingLink } = body;

    if (!title || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'title, scheduledAt and duration are required' },
        { status: 400 },
      );
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        instructorId: instructor.id,
        courseId: courseId || null,
        title,
        description: description || null,
        subject: subject || null,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration, 10),
        maxParticipants: maxParticipants || 100,
        meetingLink: meetingLink || null,
        status: 'scheduled',
      },
    });

    return NextResponse.json({ success: true, data: liveClass }, { status: 201 });
  } catch (error: any) {
    console.error('Create instructor live class error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 });
  }
}
