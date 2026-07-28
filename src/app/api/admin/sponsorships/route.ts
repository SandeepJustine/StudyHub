import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/sponsorships
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const [sponsorships, total] = await Promise.all([
      prisma.sponsorshipSlot.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.sponsorshipSlot.count({ where }),
    ]);

    const activeSponsorships = await prisma.sponsorshipSlot.count({
      where: { status: 'active' },
    });

    const totalRevenue = await prisma.sponsorshipSlot.aggregate({
      _sum: { price: true },
    });

    const totalImpressions = await prisma.sponsorshipSlot.aggregate({
      _sum: { impressions: true },
    });

    const totalClicks = await prisma.sponsorshipSlot.aggregate({
      _sum: { clicks: true },
    });

    return NextResponse.json({
      success: true,
      data: sponsorships,
      stats: {
        activeSponsorships,
        totalRevenue: totalRevenue._sum.price || 0,
        totalImpressions: totalImpressions._sum.impressions || 0,
        totalClicks: totalClicks._sum.clicks || 0,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Sponsorships error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsorships' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sponsorships
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { sponsor, type, targetUrl, imageUrl, startDate, endDate, price } = body;

    if (!sponsor || !type || !startDate || !endDate || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: sponsor, type, startDate, endDate, price' },
        { status: 400 }
      );
    }

    // Check for conflicting slots (same sponsor and type overlapping dates)
    const conflicting = await prisma.sponsorshipSlot.count({
      where: {
        type,
        status: { in: ['active', 'scheduled'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (conflicting > 0) {
      return NextResponse.json(
        { error: 'A sponsorship of this type already exists for this period' },
        { status: 409 }
      );
    }

    const sponsorship = await prisma.sponsorshipSlot.create({
      data: {
        sponsor,
        type,
        targetUrl: targetUrl || '',
        imageUrl: imageUrl || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        price: parseInt(price) || 0,
        status: new Date(startDate) <= new Date() ? 'active' : 'scheduled',
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SPONSORSHIP_CREATED',
        entity: 'SPONSORSHIP',
        entityId: sponsorship.id,
        changes: { sponsor, type, price },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: sponsorship,
      message: 'Sponsorship created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create sponsorship error:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsorship' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sponsorships
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { sponsorshipId, action } = body;

    if (!sponsorshipId || !action) {
      return NextResponse.json(
        { error: 'sponsorshipId and action are required' },
        { status: 400 }
      );
    }

    const sponsorship = await prisma.sponsorshipSlot.findUnique({
      where: { id: sponsorshipId },
    });

    if (!sponsorship) {
      return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
    }

    let updated;

    switch (action) {
      case 'activate':
        updated = await prisma.sponsorshipSlot.update({
          where: { id: sponsorshipId },
          data: { status: 'active' },
        });
        break;
      case 'pause':
        updated = await prisma.sponsorshipSlot.update({
          where: { id: sponsorshipId },
          data: { status: 'scheduled' },
        });
        break;
      case 'cancel':
        updated = await prisma.sponsorshipSlot.update({
          where: { id: sponsorshipId },
          data: { status: 'cancelled' },
        });
        break;
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Sponsorship ${action}d successfully`,
    });

  } catch (error) {
    console.error('Update sponsorship error:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsorship' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sponsorships
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sponsorshipId = searchParams.get('id');

    if (!sponsorshipId) {
      return NextResponse.json({ error: 'Sponsorship ID required' }, { status: 400 });
    }

    const sponsorship = await prisma.sponsorshipSlot.findUnique({
      where: { id: sponsorshipId },
    });

    if (!sponsorship) {
      return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
    }

    await prisma.sponsorshipSlot.delete({ where: { id: sponsorshipId } });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SPONSORSHIP_DELETED',
        entity: 'SPONSORSHIP',
        entityId: sponsorshipId,
        changes: { sponsor: sponsorship.sponsor, type: sponsorship.type },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Sponsorship deleted' });

  } catch (error) {
    console.error('Delete sponsorship error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsorship' },
      { status: 500 }
    );
  }
}