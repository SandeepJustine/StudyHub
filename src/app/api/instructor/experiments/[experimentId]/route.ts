import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { AppError } from '@/lib/utils/errors';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { experimentId } = await params;
    const body = await req.json();
    const { courseId, moduleId, status } = body;

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const access = await featureGating.checkAccess(session.user.id, 'experiment:manage');
    if (!access.hasAccess) {
      throw new AppError('Experiment management requires Instructor Pro plan', 'FEATURE_NOT_AVAILABLE', 403);
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    const updated = await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        courseId: courseId !== undefined ? courseId : experiment.courseId,
        moduleId: moduleId !== undefined ? moduleId : experiment.moduleId,
        status: status || experiment.status,
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Experiment updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update experiment' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { experimentId } = await params;

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        courseId: null,
        moduleId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Experiment unassigned successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to unassign experiment' },
      { status: error.status || 500 }
    );
  }
}