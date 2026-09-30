'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Inbox,
  Loader2,
  Trash2,
  Wallet,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotification, type AppNotification } from '@/hooks/useNotification';
import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  course: BookOpen,
  payment: CreditCard,
  exam: GraduationCap,
  event: Calendar,
  certificate: Award,
  payout: Wallet,
  support: MessageSquare,
  system: AlertTriangle,
};

const ICON_STYLES: Record<string, string> = {
  course: 'bg-blue-50 text-blue-600',
  payment: 'bg-green-50 text-green',
  exam: 'bg-purple-50 text-purple-600',
  event: 'bg-yellow-50 text-yellow-600',
  certificate: 'bg-green-50 text-green',
  payout: 'bg-navy/10 text-navy',
  support: 'bg-grey-light text-grey-dark',
  system: 'bg-red-50 text-red',
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isMutating,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotification();

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleView = useCallback(
    async (notification: AppNotification) => {
      setIsOpen(false);
      if (!notification.isRead) void markAsRead(notification.id);
      router.push(notification.link);
    },
    [markAsRead, router]
  );

  const handleToggle = () => {
    setIsOpen((open) => {
      if (!open) void refresh();
      return !open;
    });
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
        className="relative p-2 hover:bg-grey-light rounded-lg transition-colors"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-navy' : 'text-grey-dark'} />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 items-center justify-center leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />

          <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-xl shadow-xl border border-grey-light z-50 flex flex-col max-h-[min(32rem,calc(100dvh-6rem))]">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-grey-light shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-semibold text-navy">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="error" size="sm">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={unreadCount === 0 || isMutating}
                  onClick={() => void markAllAsRead()}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} className="mr-1" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={notifications.length === 0 || isMutating}
                  onClick={() => void clearAll(false)}
                  title="Clear all notifications"
                >
                  <Trash2 size={14} className="mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-grey-medium">
                  <Loader2 size={16} className="animate-spin" />
                  Loading notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <Inbox size={32} className="text-grey-medium" />
                  <p className="text-sm font-medium text-navy">No notifications yet</p>
                  <p className="text-xs text-grey-medium">
                    Payment updates, exam results and class reminders will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-grey-light">
                  {notifications.map((notification) => {
                    const Icon = ICONS[notification.icon] ?? AlertTriangle;

                    return (
                      <li
                        key={notification.id}
                        className={cn(
                          'group relative px-4 py-3 transition-colors hover:bg-grey-light/50',
                          !notification.isRead && 'bg-navy/[0.03]'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg shrink-0',
                              ICON_STYLES[notification.icon] ?? ICON_STYLES.system
                            )}
                          >
                            <Icon size={16} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p
                                className={cn(
                                  'text-sm break-words min-w-0 flex-1',
                                  notification.isRead ? 'text-grey-dark' : 'font-semibold text-navy'
                                )}
                              >
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span
                                  className="w-2 h-2 rounded-full bg-red shrink-0 mt-1.5"
                                  aria-label="Unread"
                                />
                              )}
                            </div>

                            <p className="text-xs text-grey-medium mt-0.5 break-words">{notification.message}</p>

                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-[11px] text-grey-medium">{relativeTime(notification.createdAt)}</span>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => void handleView(notification)}
                                  title="View details"
                                >
                                  View
                                  <ExternalLink size={12} className="ml-1" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => void deleteNotification(notification.id)}
                                  title="Delete notification"
                                  aria-label={`Delete notification: ${notification.title}`}
                                >
                                  <Trash2 size={14} className="text-red" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {error && (
              <div className="px-4 py-2 border-t border-grey-light bg-red-50 shrink-0">
                <p className="text-xs text-red break-words">{error}</p>
              </div>
            )}

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-grey-light bg-grey-light/40 flex items-center justify-between shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isMutating}
                  onClick={() => void refresh()}
                >
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isMutating}
                  onClick={() => void clearAll(true)}
                >
                  Clear read
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;