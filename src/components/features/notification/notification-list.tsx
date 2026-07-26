'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CreditCard, 
  GraduationCap, 
  Calendar, 
  MessageSquare,
  Award,
  AlertCircle,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  metadata?: any;
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onViewDetails?: (notification: Notification) => void;
  isLoading?: boolean;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewDetails,
  isLoading,
}: NotificationListProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    PAYMENT_CONFIRMATION: <CreditCard size={18} className="text-green" />,
    EXAM_RESULT: <GraduationCap size={18} className="text-blue-600" />,
    CLASS_REMINDER: <Calendar size={18} className="text-purple-600" />,
    FORUM_REPLY: <MessageSquare size={18} className="text-orange-600" />,
    CERTIFICATE_ISSUED: <Award size={18} className="text-yellow-600" />,
    RENEWAL_REMINDER: <AlertCircle size={18} className="text-red" />,
  };

  const typeColors: Record<string, string> = {
    PAYMENT_CONFIRMATION: 'bg-green-50 border-green-200',
    EXAM_RESULT: 'bg-blue-50 border-blue-200',
    CLASS_REMINDER: 'bg-purple-50 border-purple-200',
    FORUM_REPLY: 'bg-orange-50 border-orange-200',
    CERTIFICATE_ISSUED: 'bg-yellow-50 border-yellow-200',
    RENEWAL_REMINDER: 'bg-red-50 border-red-200',
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} padding="md" className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-grey-light rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-grey-light rounded w-3/4" />
                <div className="h-3 bg-grey-light rounded w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell size={48} className="mx-auto text-grey-medium mb-3" />
        <p className="text-grey-dark">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-navy">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="error">{unreadCount} new</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const isUnread = !notification.readAt;
          const IconComponent = typeIcons[notification.type] || <Bell size={18} className="text-grey-medium" />;
          const colorClass = typeColors[notification.type] || 'bg-grey-light/50';

          return (
            <Card
              key={notification.id}
              padding="md"
              className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                isUnread ? colorClass : 'opacity-75'
              }`}
              onClick={() => onViewDetails?.(notification)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isUnread ? 'bg-white' : 'bg-grey-light/50'}`}>
                  {IconComponent}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm truncate ${isUnread ? 'font-semibold text-navy' : 'text-grey-dark'}`}>
                      {notification.title}
                    </h4>
                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-grey-light rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check size={14} className="text-green" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-grey-dark line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-grey-medium mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}