import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { notificationService } from '@/lib/notifications/notification-service';

type TicketCategory = 'PAYMENT' | 'ACCOUNT' | 'CONTENT' | 'TECHNICAL' | 'OTHER';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export class SupportService {
  /**
   * Create support ticket
   */
  async createTicket(userId: string, data: {
    category: TicketCategory;
    subject: string;
    description: string;
    priority?: TicketPriority;
    attachments?: string[];
  }) {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        category: data.category,
        priority: data.priority || 'normal',
        subject: data.subject,
        description: data.description,
        attachments: data.attachments || [],
        status: 'open',
      },
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
    });

    // Auto-assign based on category
    await this.autoAssign(ticket.id, data.category);

    // Send confirmation
    await notificationService.send({
      userId,
      type: 'SUPPORT_TICKET',
      title: 'Support Ticket Created',
      message: `Your ticket #${ticket.id.slice(0, 8)} has been created. We'll respond shortly.`,
      priority: 'normal',
    });

    return ticket;
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = params || {};

    const where: any = { userId };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          responses: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Respond to ticket
   */
  async respondToTicket(
    ticketId: string,
    responderId: string,
    data: {
      message: string;
      isInternal?: boolean;
      attachments?: string[];
    }
  ) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    // Verify responder is admin or ticket owner
    const responder = await prisma.user.findUnique({
      where: { id: responderId },
    });

    if (responder?.role !== 'PLATFORM_ADMIN' && ticket.userId !== responderId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    const response = await prisma.supportResponse.create({
      data: {
        ticketId,
        userId: responderId,
        message: data.message,
        isInternal: data.isInternal || false,
        attachments: data.attachments || [],
      },
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
    });

    // Update ticket status if admin response
    if (responder?.role === 'PLATFORM_ADMIN' && ticket.status === 'open') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' },
      });
    }

    // Notify ticket owner of response (if not internal)
    if (!data.isInternal && ticket.userId !== responderId) {
      await notificationService.send({
        userId: ticket.userId,
        type: 'SUPPORT_RESPONSE',
        title: 'New Response to Your Support Ticket',
        message: `There's a new response to your ticket #${ticketId.slice(0, 8)}.`,
        priority: 'normal',
      });
    }

    return response;
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId: string, adminId: string, resolution?: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundError('Ticket');

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'resolved',
        resolution,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Get admin ticket queue
   */
  async getAdminQueue(params: {
    category?: TicketCategory;
    priority?: TicketPriority;
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, priority, status = 'open', page = 1, limit = 20 } = params;

    const where: any = { status };
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { fullName: true, email: true, role: true },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Auto-assign ticket based on category
   */
  private async autoAssign(ticketId: string, category: TicketCategory) {
    const assignmentMap: Record<TicketCategory, string> = {
      PAYMENT: 'payment_support',
      ACCOUNT: 'account_support',
      CONTENT: 'content_support',
      TECHNICAL: 'technical_support',
      OTHER: 'general_support',
    };

    const queue = assignmentMap[category];

    // In production, implement round-robin or load-based assignment
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        // assignedTo: nextAvailableAgent(queue),
      },
    });
  }
}