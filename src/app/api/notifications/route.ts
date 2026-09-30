import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { notificationService } from '@/lib/notifications/notification-service';
import {
  resolveNotificationIcon,
  resolveNotificationLink,
  type NotificationRole,
} from '@/lib/notifications/notification-links';

export const dynamic = 'force-dynamic';

const serialize = (notification: any, role: NotificationRole) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  channels: notification.channels ?? [],
  metadata: notification.metadata ?? null,
  createdAt: notification.createdAt,
  isRead: notification.status === 'read',
  link: resolveNotificationLink({ type: notification.type, metadata: notification.metadata }, role),
  icon: resolveNotificationIcon(notification.type),
});

// List notifications for the signed-in user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const readParam = searchParams.get('read');

    if (searchParams.get('countOnly') === '1') {
      const unreadCount = await notificationService.getUnreadCount(session.user.id);
      return NextResponse.json({ success: true, unreadCount });
    }

    const result = await notificationService.getUserNotifications(session.user.id, {
      type: searchParams.get('type') || undefined,
      read: readParam === null ? undefined : readParam === 'true',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    });

    const role = (session.user.role ?? 'STUDENT') as NotificationRole;

    return NextResponse.json({
      success: true,
      data: result.notifications.map((n) => serialize(n, role)),
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark one notification read, or every notification with { all: true }
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.all) {
      const updated = await notificationService.markAllAsRead(session.user.id);
      return NextResponse.json({
        success: true,
        updated,
        unreadCount: await notificationService.getUnreadCount(session.user.id),
        message: updated === 0 ? 'No unread notifications' : 'All notifications marked as read',
      });
    }

    if (!body?.notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const updated = await notificationService.markAsRead(body.notificationId, session.user.id);

    return NextResponse.json({
      success: true,
      updated,
      unreadCount: await notificationService.getUnreadCount(session.user.id),
      message: updated === 0 ? 'Notification not found or already read' : 'Notification marked as read',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// Delete every notification, or only the read ones with { readOnly: true }
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const readOnly = new URL(req.url).searchParams.get('readOnly') === 'true';
    const deleted = await notificationService.clearNotifications(session.user.id, readOnly);

    return NextResponse.json({
      success: true,
      deleted,
      unreadCount: await notificationService.getUnreadCount(session.user.id),
      message: readOnly ? 'Read notifications cleared' : 'All notifications cleared',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}

// Update notification preferences
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await req.json();

    await notificationService.updatePreferences(session.user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}