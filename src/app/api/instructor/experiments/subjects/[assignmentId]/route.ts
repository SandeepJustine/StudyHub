import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { labService } from '@/lib/lab/lab-service';
import { instructorService } from '@/lib/instructor/instructor-service';
import { AppError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);
    const { assignmentId } = await params;

    await labService.unassignExperimentFromSubject(assignmentId, instructor.id);

    return NextResponse.json({ success: true, message: 'Experiment removed from subject' });
  } catch (error: any) {
    console.error('Error removing subject assignment:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to remove subject assignment' }, { status: 500 });
  }
}