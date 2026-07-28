import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/institutions
 * List all institutions with filtering (Admin only)
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
      tier: searchParams.get('tier') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { slug: { contains: params.query, mode: 'insensitive' } },
        { contactEmail: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.tier) where.tier = params.tier;
    if (params.status === 'active') where.isActive = true;
    if (params.status === 'inactive') where.isActive = false;

    const [institutions, total, stats] = await Promise.all([
      prisma.institution.findMany({
        where,
        include: {
          _count: {
            select: { students: true, admins: true },
          },
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
              amount: true,
              tier: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.institution.count({ where }),
      prisma.institution.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ]);

    const formattedInstitutions = institutions.map(inst => {
      const activeSubscription = inst.subscriptions[0];
      
      return {
        id: inst.id,
        name: inst.name,
        slug: inst.slug,
        tier: inst.tier,
        logo: inst.logo,
        primaryColor: inst.primaryColor,
        accentColor: inst.accentColor,
        maxStudents: inst.maxStudents,
        currentStudents: inst.currentStudents,
        address: inst.address,
        contactPhone: inst.contactPhone,
        contactEmail: inst.contactEmail,
        website: inst.website,
        isActive: inst.isActive,
        students: inst._count.students,
        teachers: inst._count.admins,
        subscriptionStatus: activeSubscription?.status || 'inactive',
        subscriptionAmount: activeSubscription?.amount || 0,
        subscriptionTier: activeSubscription?.tier || inst.tier,
        renewalDate: activeSubscription?.endDate || null,
        activeSince: inst.createdAt,
        createdAt: inst.createdAt,
      };
    });

    const totalStudents = await prisma.student.count({
      where: { institutionId: { not: null } },
    });

    return NextResponse.json({
      success: true,
      data: formattedInstitutions,
      stats: {
        totalInstitutions: total,
        totalStudents,
        byTier: stats.reduce((acc: Record<string, number>, curr) => {
          acc[curr.tier] = curr._count;
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
    console.error('Admin institutions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/institutions
 * Update institution tier, status, or details
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { institutionId, action, data } = body;

    if (!institutionId || !action) {
      return NextResponse.json(
        { error: 'institutionId and action are required' },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    let updatedInstitution;

    switch (action) {
      case 'update_tier': {
        if (!data?.tier) {
          return NextResponse.json({ error: 'Tier is required' }, { status: 400 });
        }
        
        const tierLimits: Record<string, number> = {
          INSTITUTION_BRONZE: 200,
          INSTITUTION_SILVER: 500,
          INSTITUTION_GOLD: 999999,
        };

        updatedInstitution = await prisma.institution.update({
          where: { id: institutionId },
          data: {
            tier: data.tier,
            maxStudents: tierLimits[data.tier] || 200,
          },
        });
        break;
      }

      case 'toggle_active':
        updatedInstitution = await prisma.institution.update({
          where: { id: institutionId },
          data: { isActive: !institution.isActive },
        });
        break;

      case 'update_details':
        updatedInstitution = await prisma.institution.update({
          where: { id: institutionId },
          data: {
            name: data.name,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            website: data.website,
            address: data.address,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid: update_tier, toggle_active, update_details` },
          { status: 400 }
        );
    }

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: `INSTITUTION_${action.toUpperCase()}`,
        entity: 'INSTITUTION',
        entityId: institutionId,
        changes: { previous: institution, updated: updatedInstitution },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInstitution,
      message: `Institution ${action.replace(/_/g, ' ')} successful`,
    });

  } catch (error) {
    console.error('Admin institution update error:', error);
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    );
  }
}
