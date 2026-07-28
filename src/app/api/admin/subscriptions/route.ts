import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/subscriptions
 * List all subscriptions with filtering and stats (Admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      query: searchParams.get('query') || undefined,
      status: searchParams.get('status') || undefined,
      tier: searchParams.get('tier') || undefined,
      cycle: searchParams.get('cycle') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { user: { fullName: { contains: params.query, mode: 'insensitive' } } },
        { user: { email: { contains: params.query, mode: 'insensitive' } } },
        { institution: { name: { contains: params.query, mode: 'insensitive' } } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.tier) where.tier = params.tier;
    if (params.cycle) where.cycle = params.cycle;

    const [subscriptions, total, stats] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    // Calculate MRR from active subscriptions
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { amount: true, cycle: true },
    });

    const mrr = activeSubs.reduce((sum, sub) => {
      return sum + (sub.cycle === 'ANNUAL' ? Math.floor(sub.amount / 12) : sub.amount);
    }, 0);

    return NextResponse.json({
      success: true,
      data: subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.fullName,
        userEmail: sub.user.email,
        userRole: sub.user.role,
        institutionId: sub.institutionId,
        institutionName: sub.institution?.name,
        institutionSlug: sub.institution?.slug,
        tier: sub.tier,
        cycle: sub.cycle,
        status: sub.status,
        amount: sub.amount,
        discountAmount: sub.discountAmount,
        startDate: sub.startDate,
        endDate: sub.endDate,
        cancelledAt: sub.cancelledAt,
        autoRenew: sub.autoRenew,
        paymentMethod: sub.paymentMethod,
        transactionCount: sub._count.transactions,
        createdAt: sub.createdAt,
      })),
      stats: {
        totalSubscriptions: total,
        mrr,
        byStatus: stats.reduce((acc: Record<string, any>, curr) => {
          acc[curr.status] = {
            count: curr._count,
            revenue: curr._sum.amount || 0,
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
    console.error('Admin subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/subscriptions
 * Update subscription status or details
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, action, reason } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'subscriptionId and action are required' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    let updatedSubscription;

    switch (action) {
      case 'cancel':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            autoRenew: false,
          },
        });
        break;

      case 'reactivate':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            cancelledAt: null,
            autoRenew: true,
          },
        });
        break;

      case 'pause':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'paused' },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: `SUBSCRIPTION_${action.toUpperCase()}`,
        entity: 'SUBSCRIPTION',
        entityId: subscriptionId,
        changes: { from: subscription.status, to: updatedSubscription.status, reason },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: `Subscription ${action}ed successfully`,
    });

  } catch (error) {
    console.error('Admin subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
