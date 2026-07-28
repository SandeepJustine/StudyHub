import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/audit-logs
 * List all audit logs with filtering (Admin only)
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
      entity: searchParams.get('entity') || undefined,
      action: searchParams.get('action') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Build where clause
    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { entityId: { contains: params.query, mode: 'insensitive' } },
        { action: { contains: params.query, mode: 'insensitive' } },
        { entity: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.adminId) where.adminId = params.adminId;

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = new Date(params.startDate);
      if (params.endDate) where.timestamp.lte = new Date(params.endDate);
    }

    // Fetch logs with admin info
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format logs for the frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      admin: log.admin?.fullName || 'System',
      adminEmail: log.admin?.email || 'system@studyhub.mw',
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes,
      ipAddress: log.ipAddress || 'N/A',
      userAgent: log.userAgent || 'N/A',
      timestamp: log.timestamp,
    }));

    // Get summary stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.auditLog.count({
      where: { timestamp: { gte: todayStart } },
    });

    const uniqueAdmins = await prisma.auditLog.groupBy({
      by: ['adminId'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      stats: {
        totalLogs: total,
        todayCount,
        uniqueAdmins: uniqueAdmins.length,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
