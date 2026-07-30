import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { instructorService } from '@/lib/instructor/instructor-service';

type Params = { params: Promise<{ classId: string }> };

/**
 * GET /api/instructor/live-classes/[classId]
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { classId } = await params;

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const liveClass = await prisma.liveClass.findFirst({
      where: { id: classId, instructorId: instructor.id },
      include: { course: { select: { title: true, subject: true } } },
    });
    if (!liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: liveClass });
  } catch (error: any) {
    console.error('Instructor live-class detail error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch live class' }, { status: 500 });
  }
}

/**
 * PUT /api/instructor/live-classes/[classId]
 * Update status / recording link / other editable fields.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { classId } = await params;

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const existing = await prisma.liveClass.findFirst({
      where: { id: classId, instructorId: instructor.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, recordingUrl, meetingLink, currentParticipants } = body;

    const updated = await prisma.liveClass.update({
      where: { id: classId },
      data: {
        ...(status && { status }),
        ...(recordingUrl !== undefined && { recordingUrl }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(currentParticipants !== undefined && { currentParticipants }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update instructor live class error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update live class' }, { status: 500 });
  }
}

/**
 * DELETE /api/instructor/live-classes/[classId]
 * Cancel a live class.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { classId } = await params;

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const existing = await prisma.liveClass.findFirst({
      where: { id: classId, instructorId: instructor.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    const updated = await prisma.liveClass.update({
      where: { id: classId },
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Cancel instructor live class error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to cancel live class' }, { status: 500 });
  }
}
