import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// List courses for the institution
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const courses = await institutionService.getCourses(
      session.user.institutionId!
    );

    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch courses' }, { status });
  }
}
