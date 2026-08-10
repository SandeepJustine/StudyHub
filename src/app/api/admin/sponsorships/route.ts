import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

function getBaseUrl(req: Request): string {
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

function normalizeUrl(url: string | null | undefined, req: Request): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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
      placement: searchParams.get('placement') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.placement) where.placement = params.placement;

    const [sponsorships, total] = await Promise.all([
      prisma.sponsorshipSlot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
 * Supports both JSON and multipart/form-data (for image uploads)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    let sponsor, type, targetUrl, imageUrl, image, startDate, endDate, price, description, placement;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      sponsor = formData.get('sponsor') as string;
      type = formData.get('type') as string;
      targetUrl = formData.get('targetUrl') as string;
      imageUrl = formData.get('imageUrl') as string;
      startDate = formData.get('startDate') as string;
      endDate = formData.get('endDate') as string;
      price = formData.get('price') as string;
      description = formData.get('description') as string;
      placement = formData.get('placement') as string;
      const file = formData.get('image') as File | null;

      if (file && file.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid image type. Allowed: JPG, PNG, WebP, GIF' },
            { status: 400 }
          );
        }
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: 'Image too large. Maximum size: 5MB' },
            { status: 400 }
          );
        }

        const timestamp = Date.now();
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const filename = `${timestamp}-${uuidv4()}${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'sponsorships');
        await mkdir(uploadDir, { recursive: true });
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(join(uploadDir, filename), buffer);
        image = `/uploads/sponsorships/${filename}`;
      }
    } else {
      const body = await req.json();
      sponsor = body.sponsor;
      type = body.type;
      targetUrl = body.targetUrl;
      imageUrl = body.imageUrl;
      image = body.image;
      startDate = body.startDate;
      endDate = body.endDate;
      price = body.price;
      description = body.description;
      placement = body.placement;
    }

    if (!sponsor || !type || !startDate || !endDate || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: sponsor, type, startDate, endDate, price' },
        { status: 400 }
      );
    }

    const conflicting = await prisma.sponsorshipSlot.count({
      where: {
        type,
        placement: placement || undefined,
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
        { error: 'A sponsorship of this type and placement already exists for this period' },
        { status: 409 }
      );
    }

    const sponsorship = await prisma.sponsorshipSlot.create({
      data: {
        sponsor,
        type,
        targetUrl: targetUrl || '',
        imageUrl: normalizeUrl(imageUrl, req) || '',
        image: image || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        price: parseInt(price as string) || 0,
        description: description || null,
        placement: placement || null,
        status: new Date(startDate) <= new Date() ? 'active' : 'scheduled',
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SPONSORSHIP_CREATED',
        entity: 'SPONSORSHIP',
        entityId: sponsorship.id,
        changes: { sponsor, type, placement, price },
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

    const contentType = req.headers.get('content-type') || '';
    let sponsorshipId, action, updateData: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      sponsorshipId = formData.get('sponsorshipId') as string;
      action = formData.get('action') as string;
      updateData.sponsor = formData.get('sponsor') as string;
      updateData.type = formData.get('type') as string;
      updateData.targetUrl = formData.get('targetUrl') as string;
      updateData.imageUrl = formData.get('imageUrl') as string;
      updateData.startDate = formData.get('startDate') as string;
      updateData.endDate = formData.get('endDate') as string;
      updateData.price = formData.get('price') as string;
      updateData.description = formData.get('description') as string;
      updateData.placement = formData.get('placement') as string;
      const file = formData.get('image') as File | null;

      if (file && file.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json({ error: 'Image too large. Max 5MB' }, { status: 400 });
        }
        const timestamp = Date.now();
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const filename = `${timestamp}-${uuidv4()}${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'sponsorships');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
        updateData.image = `/uploads/sponsorships/${filename}`;
      }
    } else {
      const body = await req.json();
      sponsorshipId = body.sponsorshipId;
      action = body.action;
      updateData = body;
    }

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

    if (action === 'update') {
      const data: any = {};
      if (updateData.sponsor) data.sponsor = updateData.sponsor;
      if (updateData.type) data.type = updateData.type;
      if (updateData.targetUrl !== undefined) data.targetUrl = updateData.targetUrl || '';
      if (updateData.imageUrl !== undefined) data.imageUrl = normalizeUrl(updateData.imageUrl, req) || '';
      if (updateData.image) data.image = updateData.image;
      if (updateData.startDate) data.startDate = new Date(updateData.startDate);
      if (updateData.endDate) data.endDate = new Date(updateData.endDate);
      if (updateData.price) data.price = parseInt(updateData.price) || 0;
      if (updateData.description !== undefined) data.description = updateData.description || null;
      if (updateData.placement !== undefined) data.placement = updateData.placement || null;

      updated = await prisma.sponsorshipSlot.update({
        where: { id: sponsorshipId },
        data,
      });
    } else {
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
