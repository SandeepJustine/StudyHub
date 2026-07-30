import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/analytics
 * Analytics aggregates for the instructor's courses, enrollments, revenue,
 * rating distribution and top courses.
 *
 * Query params:
 *   from  – ISO date string (inclusive)
 *   to    – ISO date string (exclusive)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const range = {
      ...(from ? { from: new Date(from) } : {}),
      ...(to ? { to: new Date(to) } : {}),
    };

    const data = await instructorService.getAnalytics(instructor.id, range);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Instructor analytics error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
