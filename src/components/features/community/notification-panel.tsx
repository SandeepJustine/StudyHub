'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  X, 
  Clock,
  MessageSquare,
  UserPlus,
  Award,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Notification {
  id: string;
  type: 'reply' | 'mention' | 'like' | 'join' | 'badge' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  maxUnread?: number;
}

const notificationIcons = {
  reply: <MessageSquare size={16} className="text-navy" />,
  mention: <MessageSquare size={16} className="text-blue-600" />,
  like: <Bell size={16} className="text-red" />,
  join: <UserPlus size={16} className="text-green" />,
  badge: <Award size={16} className="text-yellow-600" />,
  announcement: <Bell size={16} className="text-navy" />,
};

export function NotificationPanel({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead,
  onDelete,
}: NotificationPanelProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    onMarkAllRead?.();
  };

  const handleMarkRead = (id: string) => {
    onMarkRead?.(id);
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
  };

  const visibleNotifications = notifications.slice(0, visibleCount);

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-navy">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="info" size="sm">
              {unreadCount} unread
            </Badge>
          )}
          {onMarkAllRead && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="xs" 
              leftIcon={<Check size={12} />}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={32} className="mx-auto text-grey-medium mb-2" />
            <p className="text-grey-dark">No notifications yet</p>
            <p className="text-xs text-grey-medium mt-1">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          visibleNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              padding="sm" 
              className={notification.isRead ? 'opacity-60' : 'border-l-4 border-navy'}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-navy/10 rounded-lg flex-shrink-0">
                  {notificationIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-navy text-sm">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-navy rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-grey-dark mb-1">
                    {notification.message}
                  </p>
                  <span className="text-xs text-grey-medium flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.isRead && onMarkRead && (
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      leftIcon={<Check size={10} />}
                      onClick={() => handleMarkRead(notification.id)}
                    />
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      leftIcon={<X size={10} />}
                      onClick={() => handleDelete(notification.id)}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {notifications.length > visibleCount && (
        <Button 
          variant="ghost" 
          size="sm" 
          fullWidth
          onClick={() => setVisibleCount(prev => prev + 10)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
