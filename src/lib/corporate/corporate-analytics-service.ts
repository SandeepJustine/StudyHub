import prisma from '@/lib/utils/prisma';
import { NotFoundError } from '@/lib/utils/errors';

export class CorporateAnalyticsService {
  /**
   * Get analytics dashboard data for a corporate client
   */
  async getDashboardData(userId: string) {
    const client = await prisma.corporateClient.findUnique({
      where: { userId },
      select: { id: true, companyName: true, industry: true, isVerified: true },
    });
    if (!client) throw new NotFoundError('Corporate client');

    const clientId = client.id;

    // Get job postings stats
    const [totalPostings, activePostings, closedPostings, draftPostings] = await Promise.all([
      prisma.recruitmentPosting.count({ where: { clientId } }),
      prisma.recruitmentPosting.count({ where: { clientId, status: 'active' } }),
      prisma.recruitmentPosting.count({ where: { clientId, status: 'closed' } }),
      prisma.recruitmentPosting.count({ where: { clientId, status: 'draft' } }),
    ]);

    // Get applications stats
    const [totalApplications, pendingApplications, reviewedApplications, shortlistedApplications, rejectedApplications, hiredApplications] = await Promise.all([
      prisma.jobApplication.count({ where: { posting: { clientId } } }),
      prisma.jobApplication.count({ where: { posting: { clientId }, status: 'pending' } }),
      prisma.jobApplication.count({ where: { posting: { clientId }, status: 'reviewed' } }),
      prisma.jobApplication.count({ where: { posting: { clientId }, status: 'shortlisted' } }),
      prisma.jobApplication.count({ where: { posting: { clientId }, status: 'rejected' } }),
      prisma.jobApplication.count({ where: { posting: { clientId }, status: 'hired' } }),
    ]);

    // Get contracts stats
    const [totalContracts, activeContracts, draftContracts] = await Promise.all([
      prisma.corporateContract.count({ where: { clientId } }),
      prisma.corporateContract.count({ where: { clientId, status: 'active' } }),
      prisma.corporateContract.count({ where: { clientId, status: 'draft' } }),
    ]);

    // Get total spending
    const totalSpendingResult = await prisma.corporateContract.aggregate({
      where: { clientId, status: 'active' },
      _sum: { totalAmount: true },
    });
    const totalSpending = Number(totalSpendingResult._sum.totalAmount || 0);

    // Get recent applications
    const recentApplications = await prisma.jobApplication.findMany({
      where: { posting: { clientId } },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        posting: {
          select: { title: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 10,
    });

    // Get application trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const applicationsByDay = await prisma.jobApplication.groupBy({
      by: ['appliedAt'],
      where: {
        posting: { clientId },
        appliedAt: { gte: thirtyDaysAgo },
      },
      _count: { _all: true },
      orderBy: { appliedAt: 'asc' },
    });

    // Get status distribution
    const statusDistribution = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { posting: { clientId } },
      _count: { _all: true },
    });

    return {
      company: {
        name: client.companyName,
        industry: client.industry,
        isVerified: client.isVerified,
      },
      recruitment: {
        totalPostings,
        activePostings,
        closedPostings,
        draftPostings,
        totalApplications,
        pendingApplications,
        reviewedApplications,
        shortlistedApplications,
        rejectedApplications,
        hiredApplications,
        applicationRate: totalPostings > 0 ? Math.round((totalApplications / totalPostings) * 100) : 0,
        hireRate: totalApplications > 0 ? Math.round((hiredApplications / totalApplications) * 100) : 0,
      },
      contracts: {
        totalContracts,
        activeContracts,
        draftContracts,
        totalSpending,
      },
      recentApplications: recentApplications.map(a => ({
        id: a.id,
        applicantName: a.student?.user?.fullName || 'Unknown',
        applicantEmail: a.student?.user?.email || '',
        postingTitle: a.posting?.title || '',
        appliedAt: a.appliedAt,
        status: a.status,
      })),
      trends: {
        applicationsByDay: applicationsByDay.map(d => ({
          date: d.appliedAt,
          count: d._count._all,
        })),
      },
      statusDistribution: statusDistribution.map(s => ({
        status: s.status,
        count: s._count._all,
      })),
    };
  }
}
