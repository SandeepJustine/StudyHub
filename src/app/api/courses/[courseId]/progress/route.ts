// studyhub/src/app/api/courses/[courseId]/progress/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await req.json();
    const { courseId } = await params;
    
    // Get student profile
    const student = await prisma.student.findUnique({ 
      where: { userId: session.user.id },
      select: { id: true }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }
    
    // Get enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId }
    });
    
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }
    
    // Get course with modules
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          select: { id: true }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Get current completed modules
    const completedModules = enrollment.completedModules || [];
    
    // Add the module if not already completed
    if (!completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    }
    
    // Calculate progress percentage
    const progress = (completedModules.length / course.modules.length) * 100;
    
    // Update enrollment
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedModules,
        progress,
        // Mark as completed if all modules are done
        completedAt: progress === 100 ? new Date() : null
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}


