'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  metadata: Record<string, any> | null;
  createdAt: string;
  isRead: boolean;
  link: string;
  icon: string;
}

interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const POLL_INTERVAL_MS = 30_000;

export function useNotification(options: { pollInterval?: number; enabled?: boolean } = {}) {
  const { pollInterval = POLL_INTERVAL_MS, enabled = true } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyResponse = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    if (Array.isArray(payload?.data)) setNotifications(payload.data);
    if (typeof payload?.unreadCount === 'number') setUnreadCount(payload.unreadCount);
    if (payload?.pagination) setPagination(payload.pagination);
    setError('');
  }, []);

  const fetchNotifications = useCallback(
    async (opts: { silent?: boolean; page?: number; read?: boolean } = {}) => {
      if (!enabled) return;

      const requestId = ++requestIdRef.current;
      if (!opts.silent) setIsLoading(true);

      try {
        const search = new URLSearchParams();
        search.set('page', String(opts.page ?? 1));
        if (opts.read !== undefined) search.set('read', String(opts.read));

        const response = await fetch(`/api/notifications?${search.toString()}`, { cache: 'no-store' });

        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (mountedRef.current) setError(body.error || 'Failed to load notifications');
          return;
        }

        const payload = await response.json();
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        applyResponse(payload);
      } catch {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError('Network error while loading notifications');
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [enabled, applyResponse]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await fetch('/api/notifications?countOnly=1', { cache: 'no-store' });
      if (!response.ok || !mountedRef.current) return;
      const payload = await response.json();
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      // Silent: the badge is non-critical.
    }
  }, [enabled]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;

      // Optimistic so the UI responds immediately.
      let becameUnread = false;
      setNotifications((current) =>
        current.map((n) => {
          if (n.id !== notificationId || n.isRead) return n;
          becameUnread = true;
          return { ...n, isRead: true };
        })
      );
      if (becameUnread) setUnreadCount((c) => Math.max(0, c - 1));

      try {
        const response = await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!mountedRef.current) return;
        if (!response.ok) setError(payload.error || 'Failed to mark notification as read');
        else if (typeof payload.unreadCount === 'number') setUnreadCount(payload.unreadCount);
      } catch {
        if (mountedRef.current) {
          setError('Network error while marking notification as read');
          void fetchNotifications({ silent: true });
        }
      }
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    setIsMutating(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!mountedRef.current) return;

      if (!response.ok) {
        setError(payload.error || 'Failed to mark all notifications as read');
        return;
      }

      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      if (mountedRef.current) setError('Network error while marking notifications as read');
    } finally {
      if (mountedRef.current) setIsMutating(false);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const target = notifications.find((n) => n.id === notificationId);

    setNotifications((current) => current.filter((n) => n.id !== notificationId));
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!mountedRef.current) return;

      if (!response.ok) {
        setError(payload.error || 'Failed to delete notification');
        void fetchNotifications({ silent: true });
      } else if (typeof payload.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      }
    } catch {
      if (mountedRef.current) {
        setError('Network error while deleting notification');
        void fetchNotifications({ silent: true });
      }
    }
  }, [notifications, fetchNotifications]);

  const clearAll = useCallback(
    async (readOnly = false) => {
      setIsMutating(true);
      try {
        const response = await fetch(`/api/notifications?readOnly=${readOnly}`, { method: 'DELETE' });
        const payload = await response.json().catch(() => ({}));
        if (!mountedRef.current) return;

        if (!response.ok) {
          setError(payload.error || 'Failed to clear notifications');
          return;
        }

        if (readOnly) {
          setNotifications((current) => current.filter((n) => !n.isRead));
        } else {
          setNotifications([]);
        }
        setUnreadCount(payload.unreadCount ?? 0);
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - (payload.deleted ?? 0)) }));
      } catch {
        if (mountedRef.current) setError('Network error while clearing notifications');
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    []
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    void fetchNotifications();
  }, [enabled, fetchNotifications]);

  // Lightweight badge refresh on an interval, paused while the tab is hidden.
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState === 'visible') void fetchUnreadCount();
    };

    const interval = setInterval(tick, pollInterval);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [enabled, pollInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    pagination,
    isLoading,
    isMutating,
    error,
    hasNotifications: notifications.length > 0,
    refresh: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

export default useNotification;