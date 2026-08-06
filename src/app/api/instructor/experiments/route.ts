// API route for instructor experiment management.
// - GET: list all experiments (optionally with courseId for authorization)
// - POST: assign an experiment to a course/module

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { labService } from '@/lib/lab/lab-service';
import { instructorService } from '@/lib/instructor/instructor-service';
import { AppError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const instructor = await instructorService.resolveByUserId(session.user.id);

    // When courseId is provided, verify the instructor owns that course.
    // We still return ALL experiments so the client can show both
    // assigned and unassigned experiments for the assignment UI.
    if (courseId) {
      const courses = await labService.getInstructorCoursesWithModules(instructor.id);
      const ownsCourse = courses.some((c) => c.id === courseId);
      if (!ownsCourse) {
        return NextResponse.json({ error: 'Not authorized to view experiments for this course' }, { status: 403 });
      }
    }

    const experiments = await labService.getAllExperiments();

    return NextResponse.json({ success: true, data: experiments });
  } catch (error: any) {
    console.error('Error fetching experiments:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: 500 });
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
    const { experimentId, courseId, moduleId } = body;

    if (!experimentId || !courseId) {
      return NextResponse.json(
        { error: 'experimentId and courseId are required' },
        { status: 400 },
      );
    }

    const result = await labService.assignExperiment(
      experimentId,
      courseId,
      moduleId || null,
      instructor.id,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error assigning experiment:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to assign experiment' }, { status: 500 });
  }
}
