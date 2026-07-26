import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// Get institution details
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institution = await institutionService.getInstitutionByUserId(session.user.id);

    return NextResponse.json({
      success: true,
      data: institution,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch institution' },
      { status: 500 }
    );
  }
}

// Update institution settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const institution = await institutionService.updateInstitution(
      session.user.institutionId!,
      body
    );

    return NextResponse.json({
      success: true,
      data: institution,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update institution' },
      { status: 500 }
    );
  }
}