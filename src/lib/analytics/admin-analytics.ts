// src/lib/analytics/admin-analytics.ts
export class AdminAnalyticsService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      mrr,
      arpu,
      cac,
      ltv,
      churnRate,
      courseCompletionRate,
      nps,
      activeSubscriptions,
      totalUsers,
      instructorPayouts,
      upcomingRenewals,
    ] = await Promise.all([
      this.calculateMRR(),
      this.calculateARPU(),
      this.calculateCAC(),
      this.calculateLTV(),
      this.calculateChurnRate(),
      this.calculateCourseCompletionRate(),
      this.calculateNPS(),
      this.getActiveSubscriptions(),
      this.getTotalUsers(),
      this.getInstructorPayoutQueue(),
      this.getUpcomingRenewals(),
    ]);

    return {
      revenue: {
        mrr,
        breakdown: await this.getRevenueBreakdown(),
        arpu,
        cac,
        ltv,
      },
      users: {
        total: totalUsers,
        active: activeSubscriptions,
        churnRate,
      },
      courses: {
        completionRate: courseCompletionRate,
        totalCourses: await prisma.course.count(),
        totalEnrollments: await prisma.enrollment.count(),
      },
      satisfaction: {
        nps,
      },
      payouts: {
        pending: instructorPayouts.pending,
        total: instructorPayouts.total,
      },
      renewals: {
        upcoming: upcomingRenewals.count,
        atRisk: upcomingRenewals.atRisk,
      },
    };
  }

  private async calculateMRR(): Promise<number> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      if (sub.cycle === 'MONTHLY') {
        mrr += sub.amount;
      } else if (sub.cycle === 'ANNUAL') {
        mrr += Math.floor(sub.amount / 12); // Normalize annual to monthly
      }
    }

    return mrr;
  }

  private async getRevenueBreakdown(): Promise<RevenueBreakdown> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: currentMonth },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Also get subscription breakdown by type
    const subscriptions = await prisma.subscription.groupBy({
      by: ['tier'],
      where: { status: 'active' },
      _count: true,
      _sum: { amount: true },
    });

    // Calculate category breakdowns
    const categories = {
      studentSubscriptions: 0,
      institutionSubscriptions: 0,
      professionalBoards: 0,
      courses: 0,
      certificates: 0,
      recruitment: 0,
      events: 0,
      marketplace: 0,
    };

    // Map transactions to categories (implementation detail)
    return {
      total: transactions.reduce((sum, t) => sum + (t._sum.amount || 0), 0),
      byTier: subscriptions,
      byCategory: categories,
      byPaymentMethod: transactions,
    };
  }

  private async calculateARPU(): Promise<number> {
    const mrr = await this.calculateMRR();
    const activeUsers = await prisma.subscription.count({
      where: { status: 'active' },
    });

    return activeUsers > 0 ? Math.floor(mrr / activeUsers) : 0;
  }

  private async calculateCAC(): Promise<number> {
    // Marketing spend for the period
    const marketingSpend = await prisma.transaction.aggregate({
      where: {
        metadata: { path: ['type'], equals: 'marketing' },
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
      },
      _sum: { amount: true },
    });

    const newCustomers = await prisma.subscription.count({
      where: {
        status: 'active',
        startDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
      },
    });

    return newCustomers > 0 
      ? Math.floor((marketingSpend._sum.amount || 0) / newCustomers) 
      : 0;
  }

  private async calculateLTV(): Promise<number> {
    const arpu = await this.calculateARPU();
    const churnRate = await this.calculateChurnRate();
    
    return churnRate > 0 ? Math.floor(arpu / churnRate) : 0;
  }

  private async calculateChurnRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const totalSubscriptions = await prisma.subscription.count({
      where: {
        OR: [
          { status: 'active' },
          {
            status: 'cancelled',
            updatedAt: { gte: thirtyDaysAgo },
          },
        ],
      },
    });

    return totalSubscriptions > 0 ? cancelledSubscriptions / totalSubscriptions : 0;
  }

  private async calculateCourseCompletionRate(): Promise<number> {
    const completedCourses = await prisma.enrollment.count({
      where: { completedAt: { not: null } },
    });

    const totalEnrollments = await prisma.enrollment.count();

    return totalEnrollments > 0 
      ? (completedCourses / totalEnrollments) * 100 
      : 0;
  }

  private async calculateNPS(): Promise<number> {
    // Simplified NPS calculation from reviews/ratings
    const reviews = await prisma.courseReview.findMany({
      select: { rating: true },
    });

    if (reviews.length === 0) return 0;

    const promoters = reviews.filter(r => r.rating >= 9).length;
    const detractors = reviews.filter(r => r.rating <= 6).length;

    return ((promoters - detractors) / reviews.length) * 100;
  }

  private async getActiveSubscriptions(): Promise<number> {
    return prisma.subscription.count({ where: { status: 'active' } });
  }

  private async getTotalUsers(): Promise<number> {
    return prisma.user.count();
  }

  private async getInstructorPayoutQueue() {
    const pending = await prisma.payout.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true },
      _count: true,
    });

    const total = await prisma.payout.aggregate({
      _sum: { amount: true },
    });

    return {
      pending: pending._sum.amount || 0,
      pendingCount: pending._count,
      total: total._sum.amount || 0,
    };
  }

  private async getUpcomingRenewals() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcoming = await prisma.subscription.count({
      where: {
        status: 'active',
        endDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    });

    // At-risk: active but no recent activity
    const atRisk = await prisma.subscription.count({
      where: {
        status: 'active',
        user: {
          lastLoginAt: {
            lt: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      },
    });

    return { count: upcoming, atRisk };
  }
}

interface DashboardMetrics {
  revenue: {
    mrr: number;
    breakdown: RevenueBreakdown;
    arpu: number;
    cac: number;
    ltv: number;
  };
  users: {
    total: number;
    active: number;
    churnRate: number;
  };
  courses: {
    completionRate: number;
    totalCourses: number;
    totalEnrollments: number;
  };
  satisfaction: {
    nps: number;
  };
  payouts: {
    pending: number;
    total: number;
  };
  renewals: {
    upcoming: number;
    atRisk: number;
  };
}

interface RevenueBreakdown {
  total: number;
  byTier: any[];
  byCategory: Record<string, number>;
  byPaymentMethod: any[];
}