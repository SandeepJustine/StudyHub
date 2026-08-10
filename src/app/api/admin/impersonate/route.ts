import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createImpersonation } from '@/lib/auth/impersonation';
import { AuditLogger } from '@/lib/security/audit-logger';
import prisma from '@/lib/utils/prisma';

const auditLogger = new AuditLogger();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        locale: true,
        avatar: true,
        emailVerified: true,
        student: { select: { id: true, institutionId: true } },
        schoolAdmin: { select: { institutionId: true } },
        instructor: { select: { id: true } },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await createImpersonation(userId, session.user.id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'IMPERSONATE_USER',
      entity: 'USER',
      entityId: userId,
      changes: { targetEmail: targetUser.email, targetRole: targetUser.role },
    });

    const dashboardPath = getDashboardPath(targetUser.role);

    return NextResponse.json({ 
      success: true, 
      dashboardPath,
      message: `Now viewing as ${targetUser.fullName}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to impersonate user' },
      { status: 500 }
    );
  }
}

function getDashboardPath(role: string): string {
  const roleRoutes: Record<string, string> = {
    STUDENT: '/student/dashboard',
    INSTRUCTOR: '/instructor/dashboard',
    SCHOOL_ADMIN: '/school-admin/dashboard',
    CORPORATE_CLIENT: '/corporate/dashboard',
    PLATFORM_ADMIN: '/admin/dashboard',
    PARENT: '/parents/dashboard',
  };

  return roleRoutes[role] || '/';
}
