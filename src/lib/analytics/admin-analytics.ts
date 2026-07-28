import prisma from '@/lib/utils/prisma';

export class AdminAnalyticsService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [mrr, arpu, cac, ltv, churnRate, courseCompletionRate, nps, activeSubscriptions, totalUsers, instructorPayouts, upcomingRenewals] = await Promise.all([
        this.calculateMRR(), this.calculateARPU(), this.calculateCAC(), this.calculateLTV(),
        this.calculateChurnRate(), this.calculateCourseCompletionRate(), this.calculateNPS(),
        this.getActiveSubscriptions(), this.getTotalUsers(), this.getInstructorPayoutQueue(), this.getUpcomingRenewals(),
      ]);
      const [totalCourses, totalEnrollments] = await Promise.all([prisma.course.count(), prisma.enrollment.count()]);
      return {
        revenue: { mrr, breakdown: await this.getRevenueBreakdown(), arpu, cac, ltv },
        users: { total: totalUsers, active: activeSubscriptions, churnRate },
        courses: { completionRate: courseCompletionRate, totalCourses, totalEnrollments },
        satisfaction: { nps },
        payouts: { pending: instructorPayouts.pending, total: instructorPayouts.total },
        renewals: { upcoming: upcomingRenewals.count, atRisk: upcomingRenewals.atRisk },
      };
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      return { revenue: { mrr: 0, breakdown: { total: 0, byTier: [], byCategory: {}, byPaymentMethod: [] }, arpu: 0, cac: 0, ltv: 0 }, users: { total: 0, active: 0, churnRate: 0 }, courses: { completionRate: 0, totalCourses: 0, totalEnrollments: 0 }, satisfaction: { nps: 0 }, payouts: { pending: 0, total: 0 }, renewals: { upcoming: 0, atRisk: 0 } };
    }
  }

  private async calculateMRR(): Promise<number> {
    try { const subs = await prisma.subscription.findMany({ where: { status: 'active' }, select: { amount: true, cycle: true } }); return subs.reduce((sum, s) => sum + (s.cycle === 'ANNUAL' ? Math.floor(s.amount / 12) : s.amount), 0); } catch { return 0; }
  }

  private async getRevenueBreakdown(): Promise<RevenueBreakdown> {
    try {
      const cm = new Date(); cm.setDate(1); cm.setHours(0,0,0,0);
      const txns = await prisma.transaction.groupBy({ by: ['paymentMethod'], where: { createdAt: { gte: cm }, status: 'COMPLETED' }, _sum: { amount: true } });
      const subs = await prisma.subscription.groupBy({ by: ['tier'], where: { status: 'active' }, _count: true, _sum: { amount: true } });
      const cats: Record<string,number> = { studentSubscriptions:0, institutionSubscriptions:0, professionalBoards:0, courses:0, certificates:0, recruitment:0, events:0, marketplace:0 };
      for (const s of subs) { const a = s._sum.amount || 0; if (s.tier.startsWith('STUDENT_')) cats.studentSubscriptions += a; else if (s.tier.startsWith('INSTITUTION_')) cats.institutionSubscriptions += a; else if (s.tier === 'ICAM' || s.tier === 'PROFESSIONAL_BOARD') cats.professionalBoards += a; }
      return { total: txns.reduce((sum, t) => sum + (t._sum.amount || 0), 0), byTier: subs, byCategory: cats, byPaymentMethod: txns };
    } catch { return { total: 0, byTier: [], byCategory: {}, byPaymentMethod: [] }; }
  }

  private async calculateARPU(): Promise<number> { try { const m = await this.calculateMRR(); const u = await prisma.subscription.count({ where: { status: 'active' } }); return u > 0 ? Math.floor(m / u) : 0; } catch { return 0; } }
  private async calculateCAC(): Promise<number> { try { const nc = await prisma.subscription.count({ where: { status: 'active', createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } } }); return nc > 0 ? Math.floor(0 / nc) : 0; } catch { return 0; } }
  private async calculateLTV(): Promise<number> { try { const a = await this.calculateARPU(); const c = await this.calculateChurnRate(); return c > 0 ? Math.floor(a / c) : a * 12; } catch { return 0; } }

  private async calculateChurnRate(): Promise<number> {
    try {
      const d = new Date(); d.setDate(d.getDate() - 30);
      const cancelled = await prisma.subscription.count({ where: { status: 'cancelled', cancelledAt: { gte: d } } });
      const total = await prisma.subscription.count({ where: { OR: [{ status: 'active' }, { status: 'cancelled', cancelledAt: { gte: d } }] } });
      return total > 0 ? Math.round((cancelled / total) * 10000) / 10000 : 0;
    } catch { return 0; }
  }

  private async calculateCourseCompletionRate(): Promise<number> { try { const c = await prisma.enrollment.count({ where: { completedAt: { not: null } } }); const t = await prisma.enrollment.count(); return t > 0 ? Math.round((c / t) * 10000) / 100 : 0; } catch { return 0; } }
  private async calculateNPS(): Promise<number> { try { const r = await prisma.courseReview.findMany({ select: { rating: true } }); if (r.length === 0) return 0; const p = r.filter(x => x.rating >= 4).length; const d = r.filter(x => x.rating <= 2).length; return Math.round(((p - d) / r.length) * 100); } catch { return 0; } }
  private async getActiveSubscriptions(): Promise<number> { try { return await prisma.subscription.count({ where: { status: 'active' } }); } catch { return 0; } }
  private async getTotalUsers(): Promise<number> { try { return await prisma.user.count(); } catch { return 0; } }
  private async getInstructorPayoutQueue() { try { const p = await prisma.payout.aggregate({ where: { status: 'pending' }, _sum: { amount: true }, _count: true }); const t = await prisma.payout.aggregate({ _sum: { amount: true } }); return { pending: p._sum.amount || 0, pendingCount: p._count, total: t._sum.amount || 0 }; } catch { return { pending: 0, pendingCount: 0, total: 0 }; } }
  private async getUpcomingRenewals() { try { const d = new Date(); d.setDate(d.getDate() + 30); const u = await prisma.subscription.count({ where: { status: 'active', endDate: { gte: new Date(), lte: d } } }); const a = new Date(); a.setDate(a.getDate() - 30); const r = await prisma.subscription.count({ where: { status: 'active', user: { lastLoginAt: { lt: a } } } }); return { count: u, atRisk: r }; } catch { return { count: 0, atRisk: 0 }; } }
}

export interface DashboardMetrics { revenue: { mrr: number; breakdown: RevenueBreakdown; arpu: number; cac: number; ltv: number }; users: { total: number; active: number; churnRate: number }; courses: { completionRate: number; totalCourses: number; totalEnrollments: number }; satisfaction: { nps: number }; payouts: { pending: number; total: number }; renewals: { upcoming: number; atRisk: number } }
export interface RevenueBreakdown { total: number; byTier: Array<{ tier: string; _count: number; _sum: { amount: number | null } }>; byCategory: Record<string, number>; byPaymentMethod: Array<{ paymentMethod: string; _sum: { amount: number | null } }> }
