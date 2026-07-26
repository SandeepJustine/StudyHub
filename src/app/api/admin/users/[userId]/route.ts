import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { NotFoundError } from '@/lib/utils/errors';

/**
 * GET /api/admin/users/[userId]
 * Get detailed user information
 */
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        student: {
          include: {
            institution: { select: { id: true, name: true, slug: true } },
            enrollments: {
              include: {
                course: { select: { id: true, title: true, subject: true } },
              },
              orderBy: { enrolledAt: 'desc' },
              take: 5,
            },
            examAttempts: {
              orderBy: { completedAt: 'desc' },
              take: 5,
            },
          },
        },
        schoolAdmin: {
          include: {
            institution: {
              include: {
                _count: { select: { students: true, admins: true } },
              },
            },
          },
        },
        instructor: {
          include: {
            courses: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        corporateClient: {
          include: {
            jobPostings: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            contracts: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Remove sensitive data
    const { passwordHash, passwordResetToken, emailVerificationToken, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      data: safeUser,
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Soft delete or deactivate user
 */
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reason } = await req.json();

    // Prevent self-deletion
    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Lock for 100 years
        email: `deleted_${params.userId}@studyhub.mw`, // Free up email
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'DELETE_USER',
        entity: 'USER',
        entityId: params.userId,
        changes: { reason },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}