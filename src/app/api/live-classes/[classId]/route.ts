import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/live-classes/[classId]
 * Get live class details
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classId } = await params;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: classId },
      include: {
        instructor: {
          include: { user: { select: { fullName: true, avatar: true, email: true } } },
        },
        course: { select: { title: true, subject: true } },
      },
    });

    if (!liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: liveClass });

  } catch (error) {
    console.error('Live class detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch live class' }, { status: 500 });
  }
}

/**
 * PUT /api/live-classes/[classId]
 * Update live class status
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classId } = await params;
    const body = await req.json();
    const { status, recordingUrl } = body;

    const liveClass = await prisma.liveClass.findUnique({ where: { id: classId } });
    if (!liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    const updated = await prisma.liveClass.update({
      where: { id: classId },
      data: {
        ...(status && { status }),
        ...(recordingUrl && { recordingUrl }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error) {
    console.error('Update live class error:', error);
    return NextResponse.json({ error: 'Failed to update live class' }, { status: 500 });
  }
}
