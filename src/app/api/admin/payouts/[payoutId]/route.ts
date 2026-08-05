import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { PayoutService } from '@/lib/payments/payout-service';
import { AuditLogger } from '@/lib/security/audit-logger';
import { NotFoundError } from '@/lib/utils/errors';
import { z } from 'zod';
import { notificationService } from '@/lib/notifications/notification-service';

const payoutService = new PayoutService();
const auditLogger = new AuditLogger();

/**
 * GET /api/admin/payouts/[payoutId]
 * Get detailed payout information
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { payoutId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
            courses: {
              select: {
                id: true,
                title: true,
                studentsCount: true,
              },
              orderBy: { studentsCount: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundError('Payout');
    }

    // Get related transactions for this payout period
    const transactions = await prisma.transaction.findMany({
      where: {
        instructorId: payout.instructorId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(payout.period + '-01'),
          lt: new Date(payout.period + '-01'),
        },
        // Adjust date range based on period
        ...(payout.period && {
          createdAt: {
            gte: new Date(payout.period.split('-')[0] + '-' + payout.period.split('-')[1] + '-01'),
            lt: (() => {
              const [year, month] = payout.period.split('-').map(Number);
              const nextMonth = new Date(year, month, 1);
              return nextMonth;
            })(),
          },
        }),
      },
      include: {
        course: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPlatformFee = transactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
    const totalInstructorEarnings = transactions.reduce((sum, t) => sum + (t.instructorPayout || 0), 0);

    // Get audit trail
    const auditTrail = await prisma.auditLog.findMany({
      where: {
        entity: 'PAYOUT',
        entityId: payoutId,
      },
      include: {
        admin: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        payout,
        transactions: {
          items: transactions,
          count: transactions.length,
          summary: {
            totalRevenue,
            totalPlatformFee,
            totalInstructorEarnings,
          },
        },
        auditTrail,
      },
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch payout details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payouts/[payoutId]
 * Update payout status or details
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { payoutId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, notes, reference, paymentMethod } = body;

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundError('Payout');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [], // Can't change completed payouts
      failed: ['pending'], // Can retry failed payouts
      cancelled: [], // Can't change cancelled payouts
    };

    if (status && !validTransitions[payout.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${payout.status} to ${status}. Valid transitions: ${validTransitions[payout.status]?.join(', ') || 'none'}`,
        },
        { status: 400 }
      );
    }

    // Update payout
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        ...(status && { status }),
        ...(notes && {
          metadata: {
            ...(payout.metadata as any),
            notes,
            updatedBy: session.user.id,
            updatedAt: new Date().toISOString(),
          },
        }),
        ...(reference && { reference }),
        ...(paymentMethod && { paymentMethod }),
        ...(status === 'completed' && { processedAt: new Date() }),
      },
    });

    // Log audit
    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'UPDATE_PAYOUT',
      entity: 'PAYOUT',
      entityId: payoutId,
      changes: { from: payout.status, to: status || payout.status, notes },
    });

    // If marked as completed, update instructor earnings
    if (status === 'completed' && payout.status !== 'completed') {
      await prisma.instructor.update({
        where: { id: payout.instructorId },
        data: {
          pendingEarnings: { decrement: payout.amount },
          totalEarnings: { increment: payout.amount },
        },
      });

      // Send notification to instructor
      await notificationService.send({
        userId: (await prisma.instructor.findUnique({
          where: { id: payout.instructorId },
          select: { userId: true },
        }))!.userId,
        type: 'INSTRUCTOR_PAYOUT',
        title: 'Payout Processed',
        message: `Your payout of MWK ${payout.amount.toLocaleString()} for ${payout.period} has been processed.`,
        priority: 'high',
        channel: ['EMAIL', 'SMS'],
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPayout,
      message: `Payout status updated to ${status || payout.status}`,
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update payout' },
      { status: 500 }
    );
  }
}