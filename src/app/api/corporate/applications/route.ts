import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { RecruitmentService } from '@/lib/corporate/recruitment-service';

const recruitmentService = new RecruitmentService();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const postingId = searchParams.get('postingId');
    const status = searchParams.get('status') || undefined;
    const query = searchParams.get('query') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    // Resolve the CorporateClient ID from the session user
    const clientId = await recruitmentService.getClientId(session.user.id);

    let result;
    if (postingId) {
      // Get applications for a specific posting
      result = await recruitmentService.getApplications(postingId, clientId, { status, page, limit });
      return NextResponse.json({ success: true, ...result });
    } else {
      // Get all applications for the client
      result = await recruitmentService.getAllApplications(clientId, { status, query, page, limit });
      return NextResponse.json({ success: true, ...result });
    }
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch applications' }, { status });
  }
}
