import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getImpersonatedUserId, getOriginalAdminId } from '@/lib/auth/impersonation';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const impersonatedUserId = await getImpersonatedUserId();
    const originalAdminId = await getOriginalAdminId();

    return NextResponse.json({
      success: true,
      isImpersonating: !!impersonatedUserId && impersonatedUserId !== session.user.id,
      impersonatedUserId: impersonatedUserId || null,
      originalAdminId: originalAdminId || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check impersonation status' },
      { status: 500 }
    );
  }
}
