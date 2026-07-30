import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { InstitutionService } from '@/lib/institution/institution-service';

const institutionService = new InstitutionService();

// Get current branding settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branding = await institutionService.getBranding(
      (session.user as any).institutionId!
    );

    return NextResponse.json({ success: true, data: branding });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch branding' }, { status });
  }
}

// Update branding settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branding = await req.json();

    const updated = await institutionService.updateBranding(
      (session.user as any).institutionId!,
      branding
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || 'Failed to update branding' },
      { status }
    );
  }
}
