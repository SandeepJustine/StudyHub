import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import { instructorService } from '@/lib/instructor/instructor-service';

type Params = { params: Promise<{ courseId: string }> };

async function ensureOwned(courseId: string, userId: string) {
  const instructor = await instructorService.resolveByUserId(userId);
  const course = await courseService.getCourseById(courseId);
  if (course.instructorId !== instructor.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  return { instructor, course };
}

/**
 * GET /api/instructor/courses/[courseId]
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { courseId } = await params;

    const result = await ensureOwned(courseId, session.user.id);
    if (result instanceof NextResponse) return result;

    return NextResponse.json({ success: true, data: result.course });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    console.error('Instructor course detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

/**
 * PUT /api/instructor/courses/[courseId]
 * Update course details.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { courseId } = await params;

    const result = await ensureOwned(courseId, session.user.id);
    if (result instanceof NextResponse) return result;

    const body = await req.json();
    const updated = await courseService.updateCourse(courseId, result.instructor.id, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Instructor update course error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
      { status: error.statusCode || 500 },
    );
  }
}

/**
 * PATCH /api/instructor/courses/[courseId]
 * Lifecycle actions: submit-for-review, archive.
 * Body: { action: 'submit_for_review' | 'archive' }
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { courseId } = await params;

    const result = await ensureOwned(courseId, session.user.id);
    if (result instanceof NextResponse) return result;

    const body = await req.json();
    const { action } = body;

    let course;
    if (action === 'submit_for_review') {
      course = await courseService.submitForReview(courseId, result.instructor.id);
    } else if (action === 'archive') {
      course = await courseService.archiveCourse(courseId, result.instructor.id);
    } else {
      return NextResponse.json(
        { error: "Unknown action. Use 'submit_for_review' or 'archive'." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error: any) {
    console.error('Instructor course action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
      { status: error.statusCode || 500 },
    );
  }
}
