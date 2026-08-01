import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { RecruitmentService } from '@/lib/corporate/recruitment-service';

const recruitmentService = new RecruitmentService();

export async function PUT(req: Request, { params }: { params: { applicationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { applicationId } = params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Resolve the CorporateClient ID from the session user
    const clientId = await recruitmentService.getClientId(session.user.id);

    const updated = await recruitmentService.reviewApplication(applicationId, clientId, {
      status,
      notes,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to update application' }, { status });
  }
}
