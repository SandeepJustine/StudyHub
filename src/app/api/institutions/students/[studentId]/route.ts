import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// Get a single student
export async function GET(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await institutionService.getStudentById(
      session.user.institutionId!,
      params.studentId
    );

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch student' }, { status });
  }
}

// Update a student
export async function PUT(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await institutionService.updateStudent(
      session.user.institutionId!,
      params.studentId,
      body
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status });
  }
}

// Delete a student
export async function DELETE(req: Request, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await institutionService.deleteStudent(
      session.user.institutionId!,
      params.studentId
    );

    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to delete student' }, { status });
  }
}
