import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { PayoutService } from '@/lib/payments/payout-service';
import { AuditLogger } from '@/lib/security/audit-logger';
import { AppError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { PaymentMethod } from '@prisma/client';

const payoutService = new PayoutService();
const auditLogger = new AuditLogger();

/**
 * GET /api/admin/payouts
 * List all payouts with filtering (Admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify admin access
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      status: searchParams.get('status') || undefined,
      instructorId: searchParams.get('instructorId') || undefined,
      period: searchParams.get('period') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Build where clause
    const where: any = {};
    
    if (params.status) {
      where.status = params.status;
    }
    
    if (params.instructorId) {
      where.instructorId = params.instructorId;
    }
    
    if (params.period) {
      where.period = params.period;
    }

    // Fetch payouts with pagination
    const [payouts, total, summary] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          instructor: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.payout.count({ where }),
      prisma.payout.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Get payout summary by status
    const statusSummary = await prisma.payout.groupBy({
      by: ['status'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: payouts,
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalCount: summary._count,
        byStatus: statusSummary.reduce((acc: any, curr) => {
          acc[curr.status] = {
            count: curr._count,
            amount: curr._sum.amount || 0,
          };
          return acc;
        }, {}),
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Admin payouts list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payouts
 * Create payout (calculate earnings) or process payout
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (calculate, process, bulk_process)' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'calculate':
        // Calculate earnings for a specific period
        result = await payoutService.calculateEarnings(data?.period, data?.instructorId);
        break;

      case 'process':
        // Process a single payout
        if (!data?.payoutId) {
          throw new ValidationError('Payout ID is required', {
            payoutId: ['Must provide payout ID to process'],
          });
        }
        result = await payoutService.processPayout(data.payoutId, data?.method, data?.accountDetails);
        
        // Log audit
        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'PROCESS_PAYOUT',
          entity: 'PAYOUT',
          entityId: data.payoutId,
          changes: { method: data?.method },
        });
        break;

      case 'bulk_process':
        // Process multiple payouts
        if (!data?.payoutIds || !Array.isArray(data.payoutIds)) {
          throw new ValidationError('Payout IDs array is required', {
            payoutIds: ['Must provide array of payout IDs'],
          });
        }
        result = await payoutService.bulkProcessPayouts(data.payoutIds, data?.method);
        
        // Log audit
        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'BULK_PROCESS_PAYOUTS',
          entity: 'PAYOUT',
          entityId: 'BULK',
          changes: { count: data.payoutIds.length, method: data?.method },
        });
        break;

      case 'mark_paid':
        // Manually mark payout as paid (for offline payments)
        if (!data?.payoutId) {
          throw new ValidationError('Payout ID is required', {
            payoutId: ['Must provide payout ID'],
          });
        }
        result = await payoutService.markAsPaid(
          data.payoutId,
          data?.reference,
          data?.notes
        );
        
        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'MARK_PAYOUT_PAID',
          entity: 'PAYOUT',
          entityId: data.payoutId,
          changes: { reference: data?.reference, notes: data?.notes },
        });
        break;

      case 'cancel':
        // Cancel a payout
        if (!data?.payoutId) {
          throw new ValidationError('Payout ID is required', {
            payoutId: ['Must provide payout ID'],
          });
        }
        result = await payoutService.cancelPayout(data.payoutId, data?.reason);
        
        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'CANCEL_PAYOUT',
          entity: 'PAYOUT',
          entityId: data.payoutId,
          changes: { reason: data?.reason },
        });
        break;

      default:
        throw new ValidationError('Invalid action', {
          action: [`Action "${action}" is not supported`],
        });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Payout ${action.replace(/_/g, ' ')} successful`,
    });

  } catch (error: any) {
    console.error('Admin payout action error:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Payout action failed' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/payouts
 * Update payout settings (thresholds, schedules)
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Update payout settings
    // In production, store in a settings table or config
    const updatedSettings = {
      minimumPayout: settings.minimumPayout || 10000,
      payoutSchedule: settings.payoutSchedule || 'monthly',
      payoutDay: settings.payoutDay || 15,
      autoApprove: settings.autoApprove || false,
      paymentMethods: settings.paymentMethods || ['AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER'],
    };

    // Log audit
    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'UPDATE_PAYOUT_SETTINGS',
      entity: 'PAYOUT_SETTINGS',
      entityId: 'GLOBAL',
      changes: updatedSettings,
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Payout settings updated',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}