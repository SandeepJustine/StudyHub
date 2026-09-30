import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { notificationService } from '@/lib/notifications/notification-service';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await notificationService.deleteNotification(id, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      unreadCount: await notificationService.getUnreadCount(session.user.id),
      message: 'Notification deleted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}