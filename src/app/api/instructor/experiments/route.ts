import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { AppError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');
    const subject = searchParams.get('subject');

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

    const where: any = {
      status: 'published',
    };

    if (courseId) {
      where.courseId = courseId;
    }

    if (moduleId) {
      where.moduleId = moduleId;
    }

    if (subject) {
      where.subject = subject;
    }

    const experiments = await prisma.experiment.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, subject: true },
        },
        module: {
          select: { id: true, title: true, contentType: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: experiments,
      count: experiments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch experiments' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { experimentId, courseId, moduleId } = body;

    if (!experimentId) {
      return NextResponse.json(
        { error: 'experimentId is required' },
        { status: 400 }
      );
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    // Verify the instructor owns this experiment or is the course instructor
    if (experiment.createdBy && experiment.createdBy !== session.user.id) {
      // Check if instructor is the course instructor
      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { instructorId: true },
        });
        if (course?.instructorId !== instructor.id) {
          return NextResponse.json({ error: 'Not authorized to assign this experiment' }, { status: 403 });
        }
      }
    }

    // Update experiment with course and module assignment
    const updated = await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        courseId: courseId || null,
        moduleId: moduleId || null,
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Experiment assigned successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign experiment' },
      { status: error.status || 500 }
    );
  }
}