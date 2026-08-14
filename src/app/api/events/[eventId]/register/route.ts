import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { EventService } from '@/lib/events';

const eventService = new EventService();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await req.json();
    const { paymentMethod } = body;

    const result = await eventService.registerForEvent(
      session.user.id,
      eventId,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register for event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register for event' },
      { status: error.statusCode || 500 }
    );
  }
}
