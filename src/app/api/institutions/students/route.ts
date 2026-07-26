import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// Get institution students
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      query: searchParams.get('query') || undefined,
      grade: searchParams.get('grade') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await institutionService.getStudents(
      session.user.institutionId!,
      params
    );

    return NextResponse.json({
      success: true,
      data: result.students,
      pagination: result.pagination,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// Bulk enroll students (CSV import)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { students } = await req.json();

    const result = await institutionService.bulkEnrollStudents(
      session.user.institutionId!,
      students
    );

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to enroll students' },
      { status: 500 }
    );
  }
}