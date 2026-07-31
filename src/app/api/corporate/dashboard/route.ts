import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await prisma.corporateClient.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            jobPostings: true,
            contracts: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Corporate client not found' }, { status: 404 });
    }

    const [activePostings, totalApplications, activeContracts, recentPostings] = await Promise.all([
      prisma.recruitmentPosting.count({ where: { clientId: client.id, status: 'active' } }),
      prisma.jobApplication.count({
        where: {
          posting: { clientId: client.id },
        },
      }),
      prisma.corporateContract.count({ where: { clientId: client.id, status: 'active' } }),
      prisma.recruitmentPosting.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { applications: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        companyName: client.companyName,
        industry: client.industry,
        isVerified: client.isVerified,
        stats: {
          activePostings,
          totalApplications,
          activeContracts,
        },
        recentPostings: recentPostings.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          applications: p._count.applications,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status });
  }
}
