import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/instructor/earnings
 * Get instructor's earnings and payout history
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get instructor profile
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor profile not found' },
        { status: 404 }
      );
    }

    // Get earnings summary
    const [payouts, totalEarnings, pendingEarnings, recentTransactions] = await Promise.all([
      prisma.payout.findMany({
        where: { instructorId: instructor.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.payout.aggregate({
        where: {
          instructorId: instructor.id,
          status: 'completed',
        },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: {
          instructorId: instructor.id,
          status: 'pending',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          instructorId: instructor.id,
          status: 'COMPLETED',
        },
        include: {
          course: { select: { title: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate monthly earnings
    const monthlyEarnings = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        instructorId: instructor.id,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // Last 12 months
        },
      },
      _sum: { instructorPayout: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEarnings: instructor.totalEarnings,
          pendingEarnings: instructor.pendingEarnings,
          revenueShare: instructor.revenueShare,
          totalPaidOut: totalEarnings._sum.amount || 0,
          pendingPayout: pendingEarnings._sum.amount || 0,
        },
        payouts: payouts.map(p => ({
          id: p.id,
          amount: p.amount,
          period: p.period,
          status: p.status,
          paymentMethod: p.paymentMethod,
          reference: p.reference,
          processedAt: p.processedAt,
          createdAt: p.createdAt,
        })),
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          amount: t.amount,
          courseTitle: t.course?.title,
          platformFee: t.platformFee,
          yourEarnings: t.instructorPayout,
          date: t.completedAt,
        })),
        monthlyEarnings,
      },
    });

  } catch (error) {
    console.error('Instructor earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instructor/earnings
 * Request payout
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { amount, method, accountDetails } = body;

    // Get instructor
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor profile not found' },
        { status: 404 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payout amount is required' },
        { status: 400 }
      );
    }

    // Check available balance
    if (amount > instructor.pendingEarnings) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: MWK ${instructor.pendingEarnings.toLocaleString()}`,
          availableBalance: instructor.pendingEarnings,
        },
        { status: 400 }
      );
    }

    // Check minimum payout
    const minPayout = 10000; // MWK 10,000
    if (amount < minPayout) {
      return NextResponse.json(
        { error: `Minimum payout is MWK ${minPayout.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        instructorId: instructor.id,
        amount,
        period: new Date().toISOString().slice(0, 7), // Current month
        status: 'pending',
        paymentMethod: method || 'AIRTEL_MONEY',
        metadata: {
          requestedBy: session.user.id,
          requestedAt: new Date().toISOString(),
          accountDetails,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Payout request submitted. It will be processed within 2-3 business days.',
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to request payout' },
      { status: 500 }
    );
  }
}