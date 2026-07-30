import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import prisma from '@/lib/utils/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { courseId } = await params;

    // Get instructor ID
    const instructor = await prisma.instructor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    // Verify course belongs to this instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, status: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (course.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft courses can be submitted for review' }, { status: 400 });
    }

    // Submit for review
    const updated = await courseService.submitForReview(courseId, instructor.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Course submitted for review successfully',
    });

  } catch (error: any) {
    console.error('Submit course error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit course' },
      { status: 500 }
    );
  }
}
