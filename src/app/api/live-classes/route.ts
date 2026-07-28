import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/live-classes
 * List live classes with filters
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      status: searchParams.get('status') || undefined,
      subject: searchParams.get('subject') || undefined,
      instructorId: searchParams.get('instructorId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.subject) where.subject = params.subject;
    if (params.instructorId) where.instructorId = params.instructorId;

    const [classes, total, liveCount] = await Promise.all([
      prisma.liveClass.findMany({
        where,
        include: {
          instructor: {
            include: { user: { select: { fullName: true, avatar: true } } },
          },
          course: { select: { title: true, subject: true } },
        },
        orderBy: { scheduledAt: params.status === 'ended' ? 'desc' : 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.liveClass.count({ where }),
      prisma.liveClass.count({ where: { status: 'live' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: classes,
      stats: {
        total,
        liveNow: liveCount,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Live classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
  }
}

/**
 * POST /api/live-classes
 * Create a new live class (instructor only)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, subject, scheduledAt, duration, maxParticipants, courseId, meetingLink } = body;

    if (!title || !subject || !scheduledAt || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const instructor = await prisma.instructor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        instructorId: instructor.id,
        courseId: courseId || null,
        title,
        description: description || '',
        subject,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration),
        maxParticipants: maxParticipants || 100,
        meetingLink: meetingLink || '',
        status: 'scheduled',
      },
    });

    return NextResponse.json({ success: true, data: liveClass }, { status: 201 });

  } catch (error) {
    console.error('Create live class error:', error);
    return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 });
  }
}
