import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';
import { NotFoundError, AppError } from '@/lib/utils/errors';

const institutionService = new InstitutionService();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!session.user.institutionId) {
      return NextResponse.json({ success: false, error: 'No institution associated with account' }, { status: 400 });
    }

    const data = await institutionService.getDashboardData(session.user.institutionId);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load analytics data' },
      { status }
    );
  }
}
