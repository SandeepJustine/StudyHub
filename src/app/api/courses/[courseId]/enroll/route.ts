import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import { prisma } from '@/lib/prisma';

// src/app/api/courses/[courseId]/enroll/route.ts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentMethod } = await req.json();
    
    // Get student ID from session
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const studentId = student.id;

    const enrollment = await courseService.enrollStudent(
      studentId,
      courseId,
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
