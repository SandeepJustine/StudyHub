import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/payouts/instructors
 * Get instructor earnings summary for admin
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      sortBy: searchParams.get('sortBy') || 'totalEarnings',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
    };

    // Build where clause
    const where: any = {};
    if (params.search) {
      where.user = {
        OR: [
          { fullName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    // Get instructors with earnings
    const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
        where,
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
          _count: {
            select: {
              courses: true,
              payouts: true,
            },
          },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.instructor.count({ where }),
    ]);

    // Get pending payouts for each instructor
    const instructorsWithPending = await Promise.all(
      instructors.map(async (instructor) => {
        const pendingPayouts = await prisma.payout.aggregate({
          where: {
            instructorId: instructor.id,
            status: 'pending',
          },
          _sum: { amount: true },
          _count: true,
        });

        const lastPayout = await prisma.payout.findFirst({
          where: {
            instructorId: instructor.id,
            status: 'completed',
          },
          orderBy: { processedAt: 'desc' },
          select: { amount: true, processedAt: true, period: true },
        });

        return {
          id: instructor.id,
          userId: instructor.userId,
          name: instructor.user.fullName,
          email: instructor.user.email,
          phone: instructor.user.phone,
          avatar: instructor.user.avatar,
          revenueShare: instructor.revenueShare,
          totalEarnings: instructor.totalEarnings,
          pendingEarnings: instructor.pendingEarnings,
          coursesCount: instructor._count.courses,
          totalPayouts: instructor._count.payouts,
          pendingPayoutAmount: pendingPayouts._sum.amount || 0,
          pendingPayoutCount: pendingPayouts._count,
          lastPayout: lastPayout ? {
            amount: lastPayout.amount,
            date: lastPayout.processedAt,
            period: lastPayout.period,
          } : null,
        };
      })
    );

    // Calculate totals
    const totals = await prisma.instructor.aggregate({
      _sum: {
        totalEarnings: true,
        pendingEarnings: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: instructorsWithPending,
      totals: {
        totalInstructors: totals._count,
        totalEarnings: totals._sum.totalEarnings || 0,
        totalPending: totals._sum.pendingEarnings || 0,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Instructor earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor earnings' },
      { status: 500 }
    );
  }
}