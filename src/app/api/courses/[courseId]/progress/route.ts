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

    // Drop ids for modules that no longer exist. An instructor editing a live
    // course can delete a module, and a stale id would otherwise inflate the
    // numerator permanently.
    const liveModuleIds = new Set(course.modules.map((m) => m.id));
    const validCompleted = completedModules.filter((id) => liveModuleIds.has(id));

    // Calculate progress percentage, clamped so a stale count can never
    // produce a nonsensical value such as 133%.
    const totalModules = course.modules.length;
    const progress =
      totalModules > 0 ? Math.min(100, (validCompleted.length / totalModules) * 100) : 0;

    // Never revoke a completion. If an instructor adds a module after a student
    // finished, progress drops but the student keeps the completion they earned
    // (it gates certificate eligibility).
    const completedAt = enrollment.completedAt ?? (progress >= 100 ? new Date() : null);

    // Update enrollment
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedModules: validCompleted,
        progress,
        completedAt,
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


