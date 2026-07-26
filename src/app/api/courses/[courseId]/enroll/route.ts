import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethod } = await req.json();
    
    // Get student ID from session
    const studentId = session.user.studentId;
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const enrollment = await courseService.enrollStudent(
      studentId,
      params.courseId,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      data: enrollment,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Enrollment failed' },
      { status: 500 }
    );
  }
}