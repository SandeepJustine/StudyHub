// API route for unassigning an experiment from a course/module.
// - DELETE: remove experiment from its course/module assignment

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { labService } from '@/lib/lab/lab-service';
import { instructorService } from '@/lib/instructor/instructor-service';
import { AppError } from '@/lib/utils/errors';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ experimentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);
    const { experimentId } = await params;

    await labService.unassignExperiment(experimentId, instructor.id);

    return NextResponse.json({ success: true, message: 'Experiment unassigned successfully' });
  } catch (error: any) {
    console.error('Error unassigning experiment:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to unassign experiment' }, { status: 500 });
  }
}
