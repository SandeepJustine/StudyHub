import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/support/[ticketId]
 * Get ticket details with all responses
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params in Next.js 15+
    const { ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });

  } catch (error) {
    console.error('Ticket detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket details' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/support/[ticketId]
 * Add response to ticket
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params in Next.js 15+
    const { ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { message, isInternal } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const response = await prisma.supportResponse.create({
      data: {
        ticketId,
        userId: session.user.id,
        message,
        isInternal: isInternal || false,
      },
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
    });

    // Update ticket status if it was open
    if (ticket.status === 'open') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'in_progress' },
      });
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Response added successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Add response error:', error);
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    );
  }
}
