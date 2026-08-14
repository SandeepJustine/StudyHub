import { NextResponse } from 'next/server';
import { EventService } from '@/lib/events';

const eventService = new EventService();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const params = {
      type: searchParams.get('type') || undefined,
      subject: searchParams.get('subject') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
    };

    const result = await eventService.getUpcomingEvents(params);

    return NextResponse.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
