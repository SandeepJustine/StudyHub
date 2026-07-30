import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// Get a single teacher
export async function GET(req: Request, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherId } = await params;
    const teacher = await institutionService.getTeacherById(
      session.user.institutionId!,
      teacherId
    );

    return NextResponse.json({ success: true, data: teacher });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch teacher' }, { status });
  }
}

// Update a teacher
export async function PUT(req: Request, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherId } = await params;
    const body = await req.json();
    const updated = await institutionService.updateTeacher(
      session.user.institutionId!,
      teacherId,
      body
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to update teacher' }, { status });
  }
}

// Delete a teacher
export async function DELETE(req: Request, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teacherId } = await params;
    await institutionService.deleteTeacher(
      session.user.institutionId!,
      teacherId
    );

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to delete teacher' }, { status });
  }
}
