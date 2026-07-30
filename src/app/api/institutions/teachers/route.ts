import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// List teachers
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      query: searchParams.get('query') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await institutionService.getTeachers(
      session.user.institutionId!,
      params
    );

    return NextResponse.json({
      success: true,
      data: result.teachers,
      pagination: result.pagination,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch teachers' }, { status });
  }
}

// Create a teacher
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const teacher = await institutionService.createTeacher(
      session.user.institutionId!,
      body
    );

    return NextResponse.json({ success: true, data: teacher }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to create teacher' }, { status });
  }
}
