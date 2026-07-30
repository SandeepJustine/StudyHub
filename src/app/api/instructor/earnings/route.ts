import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/earnings
 * Earnings summary, payout history, recent transactions and a 12-month series.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);
    const summary = await instructorService.getEarningsSummary(instructor.id);

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Instructor earnings error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/earnings
 * Request a payout.
 * Body: { amount: number, method?: string, accountDetails?: any }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const body = await req.json();
    const payout = await instructorService.requestPayout(instructor.id, {
      amount: body.amount,
      method: body.method,
      accountDetails: body.accountDetails,
    });

    return NextResponse.json(
      {
        success: true,
        data: payout,
        message: 'Payout request submitted. It will be processed within 2-3 business days.',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Instructor payout request error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to request payout' },
      { status: error.statusCode || 500 },
    );
  }
}
