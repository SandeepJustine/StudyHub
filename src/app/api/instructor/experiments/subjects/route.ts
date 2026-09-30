// Subject-level assignment of existing experiments.
// Complements /api/instructor/experiments, which assigns to a course/module.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { labService } from '@/lib/lab/lab-service';
import { instructorService } from '@/lib/instructor/instructor-service';
import { AppError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject') || undefined;

    const [board, assignableExperiments] = await Promise.all([
      labService.getSubjectAssignmentBoard(instructor.id),
      labService.getAssignableExperiments(instructor.id, subject),
    ]);

    return NextResponse.json({
      success: true,
      // `subjects` carries the catalogue with per-subject counts.
      subjects: board.subjects,
      assignments: board.assignments,
      assignableExperiments,
    });
  } catch (error: any) {
    console.error('Error fetching subject assignments:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to fetch subject assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const body = await req.json();
    const { experimentId, subject } = body;

    if (!experimentId || !subject) {
      return NextResponse.json(
        { error: 'experimentId and subject are required' },
        { status: 400 },
      );
    }

    const assignment = await labService.assignExperimentToSubject(
      experimentId,
      subject,
      instructor.id,
    );

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        subject: assignment.subject,
        createdAt: assignment.createdAt,
        experiment: assignment.experiment,
      },
    });
  } catch (error: any) {
    console.error('Error assigning experiment to subject:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to assign experiment to subject' }, { status: 500 });
  }
}