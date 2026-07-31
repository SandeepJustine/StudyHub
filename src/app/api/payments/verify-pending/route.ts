import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin or system to trigger verification
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const maxAgeMinutes = body.maxAgeMinutes || 30;

    const results = await paymentService.verifyPendingPayments(maxAgeMinutes);

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error: any) {
    console.error('Auto-verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Auto-verification failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await paymentService.getPendingVerifications();

    return NextResponse.json({
      success: true,
      data: pending,
      count: pending.length,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending verifications' },
      { status: 500 }
    );
  }
}
