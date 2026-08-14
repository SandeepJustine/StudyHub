import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';
import { EventService } from '@/lib/events';

const eventService = new EventService();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            attended: true,
            status: true,
            registeredAt: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
