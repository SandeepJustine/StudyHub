import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/support
 * List all support tickets (Admin only)
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
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      query: searchParams.get('query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {};
    
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.priority) where.priority = params.priority;
    
    if (params.query) {
      where.OR = [
        { subject: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { user: { fullName: { contains: params.query, mode: 'insensitive' } } },
        { user: { email: { contains: params.query, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total, stats] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          responses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: { fullName: true, role: true },
              },
            },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const statusBreakdown = stats.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        user: {
          id: ticket.user.id,
          name: ticket.user.fullName,
          email: ticket.user.email,
          role: ticket.user.role,
        },
        lastResponse: ticket.responses[0] ? {
          message: ticket.responses[0].message?.substring(0, 100),
          by: ticket.responses[0].user.fullName,
          at: ticket.responses[0].createdAt,
        } : null,
        responseCount: ticket._count.responses,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
      })),
      stats: {
        total,
        open: statusBreakdown['open'] || 0,
        inProgress: statusBreakdown['in_progress'] || 0,
        resolved: statusBreakdown['resolved'] || 0,
        closed: statusBreakdown['closed'] || 0,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Support tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/support
 * Update ticket status or assign
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, action, data } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        { error: 'ticketId and action are required' },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    let updatedTicket;

    switch (action) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        updatedTicket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: data.status,
            ...(data.status === 'resolved' && { resolvedAt: new Date() }),
          },
        });
        break;

      case 'assign':
        updatedTicket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { assignedTo: data.assignedTo || session.user.id },
        });
        break;

      case 'update_priority':
        if (!data?.priority) {
          return NextResponse.json({ error: 'Priority is required' }, { status: 400 });
        }
        updatedTicket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { priority: data.priority },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: `TICKET_${action.toUpperCase()}`,
        entity: 'SUPPORT_TICKET',
        entityId: ticketId,
        changes: { from: ticket, to: updatedTicket },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: `Ticket ${action.replace(/_/g, ' ')} successful`,
    });

  } catch (error) {
    console.error('Support ticket update error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
