import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

/**
 * POST /api/trace
 *
 * Lightweight event collector for visitor and interaction tracking.
 * Called by the client-side tracker on page views and key interactions.
 *
 * Body: {
 *   type: 'pageview' | 'interaction',
 *   path: string,
 *   method?: string,
 *   userType: 'anonymous' | 'student' | 'instructor' | 'admin' | 'school_admin' | 'corporate' | 'parent',
 *   userId?: string,
 *   sessionId?: string,
 *   referrer?: string,
 *   duration?: number,        // ms on page (sent on unload / route leave)
 *   interaction?: string,     // e.g. 'enroll_click', 'course_view', 'payment_start'
 *   target?: string,          // element id / data attribute
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = 'pageview',
      path,
      method = 'GET',
      userType = 'anonymous',
      userId,
      sessionId,
      referrer,
      duration,
      interaction,
      target,
    } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    // Build a single description string so the log is readable in the table.
    const description = interaction
      ? `${type}:${interaction}${target ? ` on ${target}` : ''}`
      : type;

    await prisma.visitorLog.create({
      data: {
        path: path.slice(0, 2048),
        method: method.slice(0, 10).toUpperCase(),
        userType: userType.slice(0, 30),
        userId: typeof userId === 'string' ? userId.slice(0, 255) : undefined,
        sessionId: typeof sessionId === 'string' ? sessionId.slice(0, 255) : undefined,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        userAgent: req.headers.get('user-agent')?.slice(0, 512) || undefined,
        referrer: typeof referrer === 'string' ? referrer.slice(0, 2048) : undefined,
        duration: typeof duration === 'number' && Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : undefined,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Trace error:', error);
    // Never fail the caller because of a tracking issue.
    return NextResponse.json({ success: true }, { status: 201 });
  }
}
