import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import {
  buildPaymentStatusPayload,
  StudentProfileNotFoundError,
} from '@/lib/courses/payment-status';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const payload = await buildPaymentStatusPayload(session.user.id, courseId);

    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    if (error instanceof StudentProfileNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Failed to load payment status' }, { status: 500 });
  }
}