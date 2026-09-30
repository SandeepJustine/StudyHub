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

    const { courseId } = await params;
    
    // Check if it's FormData (for manual payments with proof)
    const contentType = req.headers.get('content-type') || '';
    let paymentMethod: string | undefined = undefined;
    let phone: string | undefined = undefined;
    let bankInfo: string | undefined = undefined;
    let proofFile: File | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const pm = formData.get('paymentMethod') as string;
      paymentMethod = pm || undefined;
      phone = (formData.get('phone') as string) || undefined;
      bankInfo = (formData.get('bankInfo') as string) || undefined;
      const proofEntry = formData.get('proofFile');
      proofFile = proofEntry instanceof File ? proofEntry : undefined;
    } else {
      const body = await req.json();
      paymentMethod = body.paymentMethod;
      phone = body.phone;
      bankInfo = body.bankInfo;
    }
    
    // Get student ID from session
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const studentId = student.id;

    const result = await courseService.enrollStudent(
      studentId,
      courseId,
      paymentMethod,
      phone,
      proofFile,
      bankInfo
    );

    if (result.redirectUrl) {
      return NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl,
        transaction: result.transaction,
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      data: result.enrollment,
      transaction: result.transaction,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Enrollment failed' },
      { status: 500 }
    );
  }
}
