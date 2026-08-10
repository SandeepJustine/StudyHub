import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { stopImpersonation } from '@/lib/auth/impersonation';
import { AuditLogger } from '@/lib/security/audit-logger';

const auditLogger = new AuditLogger();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await stopImpersonation();

    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'STOP_IMPERSONATION',
      entity: 'USER',
      entityId: session.user.id,
    });

    return result;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to stop impersonation' },
      { status: 500 }
    );
  }
}
